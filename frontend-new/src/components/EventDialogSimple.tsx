/**
 * EventDialogSimple - Diálogo simplificado para eventos
 * 
 * Un evento SOLO guarda:
 * - Nombre
 * - Diseño a usar (selecciona de existentes, NO sube nuevo)
 * - Configuraciones (fotos, countdown)
 * - Info del cliente
 */

import { useState, useEffect } from 'react';
import { Calendar, Loader2, CheckCircle2 } from 'lucide-react';
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

interface Design {
  id: string;
  name: string;
  file_path: string;
  preview_url: string;
  is_active: boolean;
}

interface EventDialogSimpleProps {
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
  design_id?: string;
  notes: string;
  client_name: string;
  client_contact: string;
}

export default function EventDialogSimple({
  open,
  onOpenChange,
  onSuccess,
  editingPreset
}: EventDialogSimpleProps) {
  const toast = useToastContext();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    event_type: 'custom',
    event_date: '',
    photos_to_take: 3,
    countdown_seconds: 5,
    auto_reset_seconds: 30,
    notes: '',
    client_name: '',
    client_contact: '',
  });
  
  const [designs, setDesigns] = useState<Design[]>([]);
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load designs when dialog opens
  useEffect(() => {
    if (open) {
      loadDesigns();
    }
  }, [open]);

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
        design_id: editingPreset.design_id,
        notes: editingPreset.notes || '',
        client_name: editingPreset.client_name || '',
        client_contact: editingPreset.client_contact || '',
      });
    } else {
      setFormData({
        name: '',
        event_type: 'custom',
        event_date: '',
        photos_to_take: 3,
        countdown_seconds: 5,
        auto_reset_seconds: 30,
        notes: '',
        client_name: '',
        client_contact: '',
      });
    }
  }, [editingPreset, open]);

  const loadDesigns = async () => {
    setIsLoadingDesigns(true);
    try {
      const data = await photoboothAPI.designs.list();
      setDesigns(data.designs);
    } catch (error) {
      console.error('Error loading designs:', error);
      toast.error('Error cargando diseños');
    } finally {
      setIsLoadingDesigns(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre del evento es obligatorio');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        event_type: formData.event_type,
        event_date: formData.event_date || undefined,
        photos_to_take: formData.photos_to_take,
        countdown_seconds: formData.countdown_seconds,
        auto_reset_seconds: formData.auto_reset_seconds,
        audio_enabled: true,
        voice_rate: 1.0,
        voice_pitch: 1.0,
        voice_volume: 1.0,
        design_id: formData.design_id,
        notes: formData.notes || undefined,
        client_name: formData.client_name || undefined,
        client_contact: formData.client_contact || undefined,
      };

      if (editingPreset) {
        await photoboothAPI.presets.update(editingPreset.id, payload);
        toast.success('Evento actualizado');
      } else {
        await photoboothAPI.presets.create(payload);
        toast.success('Evento creado');
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingPreset ? 'Editar Evento' : 'Nuevo Evento'}
          </DialogTitle>
          <DialogDescription>
            Crea un perfil rápido para este evento con su configuración
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Nombre y Tipo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">
                Nombre del Evento <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Ej: Boda María & Juan"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_type">Tipo</Label>
              <Select
                value={formData.event_type}
                onValueChange={(value: EventPreset['event_type']) => 
                  setFormData({ ...formData, event_type: value })
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
                Fecha
              </Label>
              <Input
                id="event_date"
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              />
            </div>
          </div>

          {/* Diseño */}
          <div className="space-y-2">
            <Label htmlFor="design">Diseño/Template a Usar</Label>
            {isLoadingDesigns ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando diseños...
              </div>
            ) : (
              <Select
                value={formData.design_id || 'none'}
                onValueChange={(value) => 
                  setFormData({ ...formData, design_id: value === 'none' ? undefined : value })
                }
              >
                <SelectTrigger id="design">
                  <SelectValue placeholder="Selecciona un diseño" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin diseño</SelectItem>
                  {designs.map((design) => (
                    <SelectItem key={design.id} value={design.id}>
                      {design.name} {design.is_active && '(Activo)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground">
              💡 Sube diseños en la pestaña "Diseños"
            </p>
          </div>

          {/* Configuración */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="photos">Fotos</Label>
              <Select
                value={formData.photos_to_take.toString()}
                onValueChange={(value) => 
                  setFormData({ ...formData, photos_to_take: parseInt(value) })
                }
              >
                <SelectTrigger id="photos">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n} {n === 1 ? 'foto' : 'fotos'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="countdown">Countdown</Label>
              <Select
                value={formData.countdown_seconds.toString()}
                onValueChange={(value) => 
                  setFormData({ ...formData, countdown_seconds: parseInt(value) })
                }
              >
                <SelectTrigger id="countdown">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n}s
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="autoreset">Auto-reset</Label>
              <Select
                value={formData.auto_reset_seconds.toString()}
                onValueChange={(value) => 
                  setFormData({ ...formData, auto_reset_seconds: parseInt(value) })
                }
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

          {/* Info del Cliente */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold text-muted-foreground">
              Información del Cliente (Opcional)
            </Label>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_name">Nombre</Label>
                <Input
                  id="client_name"
                  placeholder="Ej: María García"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_contact">Contacto</Label>
                <Input
                  id="client_contact"
                  placeholder="email o teléfono"
                  value={formData.client_contact}
                  onChange={(e) => setFormData({ ...formData, client_contact: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Ej: Boda elegante, imprimir 200 tiras"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                {editingPreset ? 'Actualizar' : 'Crear'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
