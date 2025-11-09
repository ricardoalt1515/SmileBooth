/**
 * EventDialog - Diálogo para crear/editar eventos
 * 
 * Principios aplicados:
 * - DRY: Reutilizable para crear y editar
 * - Fail fast: Validaciones inmediatas
 * - Good names: Variables descriptivas
 * - Single purpose: Cada función hace una cosa
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Calendar,
  Image as ImageIcon,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { useToastContext } from '../contexts/ToastContext';
import photoboothAPI from '../services/api';
import { EventPreset, EVENT_TYPE_LABELS } from '../types/preset';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';

// Constants - Avoid magic numbers
const MIN_PHOTOS = 1;
const MAX_PHOTOS = 6;
const MIN_COUNTDOWN = 1;
const MAX_COUNTDOWN = 10;
const MIN_AUTO_RESET = 10;
const MAX_AUTO_RESET = 60;
const MIN_VOICE_VALUE = 0.5;
const MAX_VOICE_VALUE = 2.0;
const VOICE_STEP = 0.1;
const MAX_FILE_SIZE_MB = 10;
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingPreset?: EventPreset | null;
}

interface FormData {
  name: string;
  event_type: EventPreset['event_type'];
  event_date: string;
  photos_to_take: number;
  countdown_seconds: number;
  auto_reset_seconds: number;
  audio_enabled: boolean;
  voice_rate: number;
  voice_pitch: number;
  voice_volume: number;
  design_id?: string;
  notes: string;
  client_name: string;
  client_contact: string;
}

interface ValidationError {
  field: string;
  message: string;
}

export default function EventDialog({
  open,
  onOpenChange,
  onSuccess,
  editingPreset
}: EventDialogProps) {
  const toast = useToastContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState<FormData>(getInitialFormData());
  const [selectedDesignFile, setSelectedDesignFile] = useState<File | null>(null);
  const [designPreviewUrl, setDesignPreviewUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  // Initialize form when editing
  useEffect(() => {
    if (editingPreset) {
      setFormData({
        name: editingPreset.name,
        event_type: editingPreset.event_type,
        event_date: editingPreset.event_date || '',
        photos_to_take: editingPreset.photos_to_take,
        countdown_seconds: editingPreset.countdown_seconds,
        auto_reset_seconds: editingPreset.auto_reset_seconds,
        audio_enabled: editingPreset.audio_enabled,
        voice_rate: editingPreset.voice_rate,
        voice_pitch: editingPreset.voice_pitch,
        voice_volume: editingPreset.voice_volume,
        design_id: editingPreset.design_id,
        notes: editingPreset.notes || '',
        client_name: editingPreset.client_name || '',
        client_contact: editingPreset.client_contact || '',
      });
      
      // Set preview if design exists
      if (editingPreset.design_preview_url) {
        setDesignPreviewUrl(editingPreset.design_preview_url);
      }
    } else {
      setFormData(getInitialFormData());
      setDesignPreviewUrl('');
    }
    
    setSelectedDesignFile(null);
    setErrors([]);
  }, [editingPreset, open]);

  // Helper: Get initial form data - Single source of truth
  function getInitialFormData(): FormData {
    return {
      name: '',
      event_type: 'custom',
      event_date: '',
      photos_to_take: 4,
      countdown_seconds: 5,
      auto_reset_seconds: 30,
      audio_enabled: true,
      voice_rate: 1.0,
      voice_pitch: 1.0,
      voice_volume: 1.0,
      notes: '',
      client_name: '',
      client_contact: '',
    };
  }

  // Helper: Validate form data - Fail fast
  function validateFormData(data: FormData): ValidationError[] {
    const validationErrors: ValidationError[] = [];

    if (!data.name.trim()) {
      validationErrors.push({
        field: 'name',
        message: 'El nombre del evento es obligatorio'
      });
    }

    if (data.name.length > 100) {
      validationErrors.push({
        field: 'name',
        message: 'El nombre no puede exceder 100 caracteres'
      });
    }

    if (data.photos_to_take < MIN_PHOTOS || data.photos_to_take > MAX_PHOTOS) {
      validationErrors.push({
        field: 'photos_to_take',
        message: `Fotos debe estar entre ${MIN_PHOTOS} y ${MAX_PHOTOS}`
      });
    }

    return validationErrors;
  }

  // Helper: Check if file is valid image - Fail fast
  function isValidImageFile(file: File): { valid: boolean; error?: string } {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Solo se permiten archivos PNG y JPG'
      };
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      return {
        valid: false,
        error: `El archivo excede ${MAX_FILE_SIZE_MB}MB`
      };
    }

    return { valid: true };
  }

  // Handler: File selection
  const handleFileSelect = useCallback((file: File) => {
    const validation = isValidImageFile(file);
    
    if (!validation.valid) {
      toast.error(validation.error!);
      return;
    }

    setSelectedDesignFile(file);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setDesignPreviewUrl(previewUrl);
  }, [toast]);

  // Handler: File input change
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handler: Drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handler: Form submission
  const handleSubmit = async () => {
    // Validate first - Fail fast
    const validationErrors = validateFormData(formData);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      toast.error(validationErrors[0].message);
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      let designId = formData.design_id;

      // Upload design if new file selected
      if (selectedDesignFile) {
        const uploadResult = await photoboothAPI.designs.upload(
          selectedDesignFile,
          `${formData.name}_design`
        );
        designId = uploadResult.design_id;
      }

      // Prepare payload
      const payload = {
        name: formData.name,
        event_type: formData.event_type,
        event_date: formData.event_date || undefined,
        photos_to_take: formData.photos_to_take,
        countdown_seconds: formData.countdown_seconds,
        auto_reset_seconds: formData.auto_reset_seconds,
        audio_enabled: formData.audio_enabled,
        voice_rate: formData.voice_rate,
        voice_pitch: formData.voice_pitch,
        voice_volume: formData.voice_volume,
        design_id: designId,
        notes: formData.notes || undefined,
        client_name: formData.client_name || undefined,
        client_contact: formData.client_contact || undefined,
      };

      // Create or update
      if (editingPreset) {
        await photoboothAPI.presets.update(editingPreset.id, payload);
        toast.success('Evento actualizado correctamente');
      } else {
        await photoboothAPI.presets.create(payload);
        toast.success('Evento creado correctamente');
      }

      // Clean up and close
      if (designPreviewUrl && designPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(designPreviewUrl);
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving preset:', error);
      const message = error.response?.data?.detail || 'Error al guardar evento';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper: Update form field - Single purpose
  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    setErrors(prev => prev.filter(err => err.field !== field));
  };

  // Helper: Get error for field
  const getFieldError = (field: string): string | undefined => {
    return errors.find(err => err.field === field)?.message;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingPreset ? 'Editar Evento' : 'Nuevo Evento'}
          </DialogTitle>
          <DialogDescription>
            {editingPreset 
              ? 'Modifica la configuración del evento'
              : 'Configura un nuevo evento con todos sus ajustes'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Información Básica
            </h3>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre del Evento <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Ej: Boda María & Juan"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={getFieldError('name') ? 'border-destructive' : ''}
              />
              {getFieldError('name') && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {getFieldError('name')}
                </p>
              )}
            </div>

            {/* Type & Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event_type">Tipo de Evento</Label>
                <Select
                  value={formData.event_type}
                  onValueChange={(value: EventPreset['event_type']) => 
                    updateField('event_type', value)
                  }
                >
                  <SelectTrigger id="event_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_date">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Fecha del Evento
                </Label>
                <Input
                  id="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => updateField('event_date', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Capture Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Configuración de Captura
            </h3>

            <div className="grid grid-cols-3 gap-4">
              {/* Photos */}
              <div className="space-y-2">
                <Label htmlFor="photos">Fotos por Sesión</Label>
                <Select
                  value={formData.photos_to_take.toString()}
                  onValueChange={(value) => updateField('photos_to_take', parseInt(value))}
                >
                  <SelectTrigger id="photos">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: MAX_PHOTOS }, (_, i) => i + 1).map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} {n === 1 ? 'foto' : 'fotos'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Countdown */}
              <div className="space-y-2">
                <Label htmlFor="countdown">Countdown (seg)</Label>
                <Select
                  value={formData.countdown_seconds.toString()}
                  onValueChange={(value) => updateField('countdown_seconds', parseInt(value))}
                >
                  <SelectTrigger id="countdown">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: MAX_COUNTDOWN }, (_, i) => i + 1).map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}s
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Auto-reset */}
              <div className="space-y-2">
                <Label htmlFor="autoreset">Auto-reset (seg)</Label>
                <Select
                  value={formData.auto_reset_seconds.toString()}
                  onValueChange={(value) => updateField('auto_reset_seconds', parseInt(value))}
                >
                  <SelectTrigger id="autoreset">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 15, 20, 30, 45, 60].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}s
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Audio Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Configuración de Audio
              </h3>
              <div className="flex items-center space-x-2">
                <Switch
                  id="audio-enabled"
                  checked={formData.audio_enabled}
                  onCheckedChange={(checked) => updateField('audio_enabled', checked)}
                />
                <Label htmlFor="audio-enabled">Audio activado</Label>
              </div>
            </div>

            {formData.audio_enabled && (
              <div className="space-y-4 pl-4 border-l-2 border-muted">
                {/* Voice Rate */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Velocidad de voz</Label>
                    <span className="text-sm text-muted-foreground">
                      {formData.voice_rate.toFixed(1)}x
                    </span>
                  </div>
                  <Slider
                    value={[formData.voice_rate]}
                    onValueChange={([value]) => updateField('voice_rate', value)}
                    min={MIN_VOICE_VALUE}
                    max={MAX_VOICE_VALUE}
                    step={VOICE_STEP}
                    className="w-full"
                  />
                </div>

                {/* Voice Pitch */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Tono de voz</Label>
                    <span className="text-sm text-muted-foreground">
                      {formData.voice_pitch.toFixed(1)}x
                    </span>
                  </div>
                  <Slider
                    value={[formData.voice_pitch]}
                    onValueChange={([value]) => updateField('voice_pitch', value)}
                    min={MIN_VOICE_VALUE}
                    max={MAX_VOICE_VALUE}
                    step={VOICE_STEP}
                    className="w-full"
                  />
                </div>

                {/* Voice Volume */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Volumen</Label>
                    <span className="text-sm text-muted-foreground">
                      {formData.voice_volume.toFixed(1)}x
                    </span>
                  </div>
                  <Slider
                    value={[formData.voice_volume]}
                    onValueChange={([value]) => updateField('voice_volume', value)}
                    min={MIN_VOICE_VALUE}
                    max={MAX_VOICE_VALUE}
                    step={VOICE_STEP}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Design Upload */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Diseño de Canva
            </h3>

            <Card
              className={`border-2 border-dashed transition-colors ${
                isDragging 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted hover:border-muted-foreground/50'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <CardContent className="p-6">
                {designPreviewUrl ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={designPreviewUrl}
                        alt="Preview"
                        className="w-full h-48 object-contain rounded-lg bg-muted"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          if (designPreviewUrl.startsWith('blob:')) {
                            URL.revokeObjectURL(designPreviewUrl);
                          }
                          setDesignPreviewUrl('');
                          setSelectedDesignFile(null);
                          updateField('design_id', undefined);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      {selectedDesignFile ? selectedDesignFile.name : 'Diseño actual'}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-sm font-medium mb-2">
                      Arrastra tu diseño aquí
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      PNG o JPG (máx. {MAX_FILE_SIZE_MB}MB)
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Seleccionar archivo
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ALLOWED_IMAGE_TYPES.join(',')}
                      className="hidden"
                      onChange={handleFileInputChange}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Client Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Información del Cliente (Opcional)
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_name">Nombre del Cliente</Label>
                <Input
                  id="client_name"
                  placeholder="Ej: María García"
                  value={formData.client_name}
                  onChange={(e) => updateField('client_name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_contact">Contacto</Label>
                <Input
                  id="client_contact"
                  placeholder="email o teléfono"
                  value={formData.client_contact}
                  onChange={(e) => updateField('client_contact', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas del Evento</Label>
              <Textarea
                id="notes"
                placeholder="Ej: Boda elegante, tema rosa. Imprimir 200 tiras."
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {editingPreset ? 'Actualizar' : 'Crear'} Evento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
