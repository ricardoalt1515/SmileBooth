/**
 * TemplateDialog
 * Dialog for creating and editing photo booth templates
 * 
 * Principles applied:
 * - DRY: Single component for create and edit
 * - Fail fast: Immediate validation
 * - Good names: Clear, descriptive variables
 * - Single purpose: Each function does one thing
 * - No magic numbers: Constants defined
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, Upload, X, CheckCircle2 } from 'lucide-react';
import { useToastContext } from '../contexts/ToastContext';
import photoboothAPI from '../services/api';
import {
  Template,
  TemplateCreate,
  LayoutType,
  DesignPositionType,
  LAYOUT_LABELS,
  DESIGN_POSITION_LABELS,
  LAYOUT_3X1_VERTICAL,
  DESIGN_POSITION_BOTTOM,
  getLayoutPhotoCount,
} from '../types/template';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// Constants - Avoid magic numbers
const DEFAULT_BACKGROUND_COLOR = '#FFFFFF';
const DEFAULT_PHOTO_SPACING = 20;
const MIN_PHOTO_SPACING = 0;
const MAX_PHOTO_SPACING = 100;
const MAX_FILE_SIZE_MB = 10;
const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingTemplate?: Template | null;
}

interface FormData {
  name: string;
  layout: LayoutType;
  design_position: DesignPositionType;
  background_color: string;
  photo_spacing: number;
}

interface ValidationError {
  field: string;
  message: string;
}

export default function TemplateDialog({
  open,
  onOpenChange,
  onSuccess,
  editingTemplate
}: TemplateDialogProps) {
  const toast = useToastContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state - Single purpose per variable
  const [formData, setFormData] = useState<FormData>(getInitialFormData());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Helper: Get initial form data - Single source of truth
  function getInitialFormData(): FormData {
    return {
      name: '',
      layout: LAYOUT_3X1_VERTICAL,
      design_position: DESIGN_POSITION_BOTTOM,
      background_color: DEFAULT_BACKGROUND_COLOR,
      photo_spacing: DEFAULT_PHOTO_SPACING,
    };
  }

  // Initialize form when editing template
  useEffect(() => {
    
    if (editingTemplate) {
      setFormData({
        name: editingTemplate.name,
        layout: editingTemplate.layout,
        design_position: editingTemplate.design_position,
        background_color: editingTemplate.background_color,
        photo_spacing: editingTemplate.photo_spacing,
      });
      
      // Set preview if has design
      if (editingTemplate.design_file_path) {
        setPreviewUrl(photoboothAPI.templates.getPreview(editingTemplate.id));
      }
    } else {
      setFormData(getInitialFormData());
      setPreviewUrl(null);
    }
    setSelectedFile(null);
    setErrors([]);
  }, [editingTemplate, open]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Validation: Validate form data - Returns errors array
  const validateFormData = useCallback((data: FormData): ValidationError[] => {
    const validationErrors: ValidationError[] = [];

    // Name validation - Fail fast
    if (!data.name.trim()) {
      validationErrors.push({ field: 'name', message: 'El nombre es obligatorio' });
    } else if (data.name.trim().length < 3) {
      validationErrors.push({ field: 'name', message: 'El nombre debe tener al menos 3 caracteres' });
    }

    // Photo spacing validation
    if (data.photo_spacing < MIN_PHOTO_SPACING || data.photo_spacing > MAX_PHOTO_SPACING) {
      validationErrors.push({
        field: 'photo_spacing',
        message: `El espaciado debe estar entre ${MIN_PHOTO_SPACING} y ${MAX_PHOTO_SPACING}px`
      });
    }

    return validationErrors;
  }, []);

  // Validation: Validate file - Returns error message or null
  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'Solo se permiten imágenes PNG o JPG';
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      return `El archivo no debe superar ${MAX_FILE_SIZE_MB}MB`;
    }

    return null;
  }, []);

  // Handler: File selection
  const handleFileSelect = useCallback((file: File) => {
    // Validate file - Fail fast
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    // Set file and create preview
    setSelectedFile(file);
    
    // Revoke old preview URL
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    
    // Create new preview URL
    const newPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(newPreviewUrl);
  }, [validateFile, toast, previewUrl]);

  // Handler: Drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Handler: Remove file
  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(editingTemplate?.design_file_path 
      ? photoboothAPI.templates.getPreview(editingTemplate.id)
      : null
    );
  }, [previewUrl, editingTemplate]);

  // Handler: Submit form
  const handleSubmit = async () => {
    // Validate form data - Fail fast
    const validationErrors = validateFormData(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      toast.error(validationErrors[0].message);
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      let templateId: string;

      if (editingTemplate) {
        // Update existing template
        await photoboothAPI.templates.update(editingTemplate.id, formData);
        templateId = editingTemplate.id;
        toast.success('Template actualizado');
      } else {
        // Create new template
        const templateData: TemplateCreate = {
          name: formData.name,
          layout: formData.layout,
          design_position: formData.design_position,
          background_color: formData.background_color,
          photo_spacing: formData.photo_spacing,
        };
        
        const newTemplate = await photoboothAPI.templates.create(templateData);
        templateId = newTemplate.id;
        toast.success('Template creado');
      }

      // Upload design file if selected
      if (selectedFile) {
        await photoboothAPI.templates.uploadDesign(templateId, selectedFile);
        toast.success('Diseño subido correctamente');
      }

      // Success callback
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData(getInitialFormData());
      setSelectedFile(null);
      setPreviewUrl(null);
      
    } catch (error: any) {
      console.error('Error saving template:', error);
      const message = error.response?.data?.detail || 'Error al guardar template';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper: Get photo count display
  const getPhotoCountDisplay = (): string => {
    const count = getLayoutPhotoCount(formData.layout);
    return `${count} ${count === 1 ? 'foto' : 'fotos'}`;
  };

  // Handler para controlar el cierre del diálogo
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal={true}>
      <DialogContent
        className="max-w-7xl max-h-[95vh] overflow-y-auto p-8"
        onKeyDown={(e) => {
          // Prevenir que Space active la cámara cuando estás escribiendo
          if (e.key === ' ' || e.code === 'Space') {
            e.stopPropagation();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {editingTemplate ? 'Editar Template' : 'Nuevo Template'}
          </DialogTitle>
          <DialogDescription>
            Define el layout y diseño para tus impresiones
          </DialogDescription>
        </DialogHeader>

        {/* Layout de 2 columnas */}
        <div className="grid grid-cols-2 gap-12 py-6">
          {/* COLUMNA IZQUIERDA: Formulario */}
          <div className="space-y-8">
            {/* Template Name */}
            <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-semibold">
              Nombre del Template <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Ej: Boda Elegante"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={errors.find(e => e.field === 'name') ? 'border-destructive' : ''}
            />
            {errors.find(e => e.field === 'name') ? (
              <p className="text-sm text-destructive">
                {errors.find(e => e.field === 'name')?.message}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Un nombre descriptivo para identificar este template
              </p>
            )}
          </div>

          {/* Layout Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="layout" className="text-sm font-medium">Layout</Label>
              <Select
                value={formData.layout}
                onValueChange={(value: LayoutType) =>
                  setFormData({ ...formData, layout: value })
                }
              >
                <SelectTrigger id="layout" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LAYOUT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {getPhotoCountDisplay()}
              </p>
            </div>

            {/* Design Position */}
            <div className="space-y-2">
              <Label htmlFor="design_position" className="text-sm font-medium">Posición del Diseño</Label>
              <Select
                value={formData.design_position}
                onValueChange={(value: DesignPositionType) =>
                  setFormData({ ...formData, design_position: value })
                }
              >
                <SelectTrigger id="design_position" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DESIGN_POSITION_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Styling Options */}
          <div className="grid grid-cols-2 gap-4">
            {/* Background Color */}
            <div className="space-y-2">
              <Label htmlFor="background_color" className="text-sm font-medium">Color de Fondo</Label>
              <div className="flex gap-2">
                <Input
                  id="background_color"
                  type="color"
                  value={formData.background_color}
                  onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                  className="w-20 h-10 p-1"
                />
                <Input
                  type="text"
                  value={formData.background_color}
                  onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                  placeholder="#FFFFFF"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Photo Spacing */}
            <div className="space-y-2">
              <Label htmlFor="photo_spacing" className="text-sm font-medium">
                Espaciado ({MIN_PHOTO_SPACING}-{MAX_PHOTO_SPACING}px)
              </Label>
              <Input
                id="photo_spacing"
                type="number"
                min={MIN_PHOTO_SPACING}
                max={MAX_PHOTO_SPACING}
                value={formData.photo_spacing}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  photo_spacing: parseInt(e.target.value) || DEFAULT_PHOTO_SPACING 
                })}
                className={errors.find(e => e.field === 'photo_spacing') ? 'border-destructive' : ''}
              />
            </div>
          </div>

          {/* Design Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Diseño de Canva (PNG/JPG)</Label>
            <p className="text-xs text-muted-foreground">
              Sube tu diseño personalizado para incluir en el strip de fotos
            </p>

            {/* Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isSubmitting && fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                transition-all duration-200
                ${isDragging ? 'border-primary bg-primary/10 scale-105' : 'border-muted-foreground/25 hover:border-primary'}
                ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isSubmitting ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">Subiendo diseño...</p>
                </div>
              ) : previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-32 mx-auto rounded"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-0 right-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile();
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm">Arrastra tu diseño aquí</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    o haz click para seleccionar (máx {MAX_FILE_SIZE_MB}MB)
                  </p>
                </>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
          </div>
          </div>
          {/* FIN COLUMNA IZQUIERDA */}

          {/* COLUMNA DERECHA: Preview Grande */}
          <div className="space-y-4">
            <div className="sticky top-0 bg-background pb-4 z-10">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-lg font-semibold">Vista Previa</Label>
                <Badge variant="outline" className="text-xs">
                  {getPhotoCountDisplay()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Así se verá tu strip de fotos
              </p>
            </div>

            {/* Preview Container */}
            <div className="relative border-2 border-border rounded-xl p-8 bg-muted/30 flex items-center justify-center min-h-[700px]">
                <Badge variant="secondary" className="absolute top-4 right-4 text-xs">
                  Strip 2x6"
                </Badge>
                <div
                  className="relative bg-white rounded-lg shadow-2xl transition-all duration-300"
                  style={{
                    width: '400px',
                    backgroundColor: formData.background_color
                  }}
                >
                  {/* Renderizar preview según layout */}
                  {formData.layout === '3x1-vertical' && (
                    <div className="space-y-3 p-4">
                      {formData.design_position === 'top' && (
                        <div className="bg-gradient-to-br from-primary/30 to-primary/10 h-28 rounded-lg flex items-center justify-center text-sm font-medium overflow-hidden border-2 border-primary/20">
                          {previewUrl ? (
                            <img src={previewUrl} alt="Design" className="w-full h-full object-cover rounded" />
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-primary">
                              <Upload className="w-8 h-8" />
                              <span>Tu Diseño</span>
                            </div>
                          )}
                        </div>
                      )}
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-muted aspect-[4/3] rounded-lg flex items-center justify-center text-lg font-bold text-muted-foreground border-2 border-border transition-all duration-300">
                          Foto {i}
                        </div>
                      ))}
                      {formData.design_position === 'bottom' && (
                        <div className="bg-gradient-to-br from-primary/30 to-primary/10 h-28 rounded-lg flex items-center justify-center text-sm font-medium overflow-hidden border-2 border-primary/20">
                          {previewUrl ? (
                            <img src={previewUrl} alt="Design" className="w-full h-full object-cover rounded" />
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-primary">
                              <Upload className="w-8 h-8" />
                              <span>Tu Diseño</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {formData.layout === '4x1-vertical' && (
                    <div className="space-y-2 p-3">
                      {formData.design_position === 'top' && (
                        <div className="bg-gradient-to-br from-primary/30 to-primary/10 h-20 rounded flex items-center justify-center text-xs font-medium overflow-hidden border border-primary/20">
                          {previewUrl ? (
                            <img src={previewUrl} alt="Design" className="w-full h-full object-cover" />
                          ) : (
                            'Tu Diseño'
                          )}
                        </div>
                      )}
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-muted aspect-[4/3] rounded flex items-center justify-center text-base font-semibold text-muted-foreground border border-border transition-all duration-300">
                          Foto {i}
                        </div>
                      ))}
                      {formData.design_position === 'bottom' && (
                        <div className="bg-gradient-to-br from-primary/30 to-primary/10 h-20 rounded flex items-center justify-center text-xs font-medium overflow-hidden border border-primary/20">
                          {previewUrl ? (
                            <img src={previewUrl} alt="Design" className="w-full h-full object-cover" />
                          ) : (
                            'Tu Diseño'
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {formData.layout === '6x1-vertical' && (
                    <div className="space-y-1.5 p-2">
                      {formData.design_position === 'top' && (
                        <div className="bg-gradient-to-br from-primary/30 to-primary/10 h-16 rounded flex items-center justify-center text-[10px] font-medium overflow-hidden border border-primary/20">
                          {previewUrl ? (
                            <img src={previewUrl} alt="Design" className="w-full h-full object-cover" />
                          ) : (
                            'Diseño'
                          )}
                        </div>
                      )}
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-muted aspect-[4/3] rounded flex items-center justify-center text-xs font-semibold text-muted-foreground border border-border transition-all duration-300">
                          {i}
                        </div>
                      ))}
                      {formData.design_position === 'bottom' && (
                        <div className="bg-gradient-to-br from-primary/30 to-primary/10 h-16 rounded flex items-center justify-center text-[10px] font-medium overflow-hidden border border-primary/20">
                          {previewUrl ? (
                            <img src={previewUrl} alt="Design" className="w-full h-full object-cover" />
                          ) : (
                            'Diseño'
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {formData.layout === '2x2-grid' && (
                    <div className="p-3">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="bg-muted aspect-square rounded flex items-center justify-center text-sm font-semibold text-muted-foreground border border-border transition-all duration-300">
                            {i}
                          </div>
                        ))}
                      </div>
                      {formData.design_position === 'bottom' && (
                        <div className="bg-gradient-to-br from-primary/30 to-primary/10 h-20 rounded flex items-center justify-center text-xs font-medium overflow-hidden border border-primary/20">
                          {previewUrl ? (
                            <img src={previewUrl} alt="Design" className="w-full h-full object-cover" />
                          ) : (
                            'Tu Diseño'
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Info del template */}
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Layout:</span>
                    <p className="font-medium">{LAYOUT_LABELS[formData.layout]}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fotos:</span>
                    <p className="font-medium">{getPhotoCountDisplay()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Posición:</span>
                    <p className="font-medium">{DESIGN_POSITION_LABELS[formData.design_position]}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Espaciado:</span>
                    <p className="font-medium">{formData.photo_spacing}px</p>
                  </div>
                </div>
              </div>
          </div>
          {/* FIN COLUMNA DERECHA */}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
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
                {editingTemplate ? 'Actualizar' : 'Crear'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
