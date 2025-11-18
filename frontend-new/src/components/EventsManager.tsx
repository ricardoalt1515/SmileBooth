/**
 * Gestor de Eventos/Presets
 * Componente principal para gestionar configuraciones de eventos
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Play, 
  Edit2, 
  Copy, 
  Trash2, 
  Calendar,
  Image as ImageIcon,
  Check,
  Star,
  Upload
} from 'lucide-react';
import { useToastContext } from '../contexts/ToastContext';
import photoboothAPI from '../services/api';
import {
  EventPreset,
  PresetsListResponse,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_COLORS
} from '../types/preset';
import { LAYOUT_LABELS } from '../types/template';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import EventDialogSimple from './EventDialogSimple';

interface EventsManagerProps {
  onEventActivated?: (preset: EventPreset) => void;
}

export default function EventsManager({ onEventActivated }: EventsManagerProps) {
  const [presets, setPresets] = useState<EventPreset[]>([]);
  const [activePreset, setActivePreset] = useState<EventPreset | null>(null);
  const [defaultPreset, setDefaultPreset] = useState<EventPreset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [presetToDelete, setPresetToDelete] = useState<string | null>(null);
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<EventPreset | null>(null);
  
  const toast = useToastContext();
  const getTemplateLayoutLabel = (layout?: string | null) =>
    layout ? LAYOUT_LABELS[layout as keyof typeof LAYOUT_LABELS] ?? null : null;

  const getFilterLabel = (filter?: EventPreset['photo_filter']): string | null => {
    if (!filter || filter === 'none') return null;
    const map: Record<string, string> = {
      bw: 'Blanco y negro',
      sepia: 'Sepia',
      glam: 'Glam (B&N)',
    };
    return map[filter] || null;
  };

  // Cargar presets al montar
  const loadPresets = useCallback(async () => {
    try {
      setIsLoading(true);
      const data: PresetsListResponse = await photoboothAPI.presets.list();
      setPresets(data.presets);
      setActivePreset(data.active_preset || null);
      setDefaultPreset(data.default_preset || null);
    } catch (error) {
      console.error('Error loading presets:', error);
      toast.error('Error al cargar eventos');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  // Activar preset
  const handleActivate = async (presetId: string) => {
    try {
      const response = await photoboothAPI.presets.activate(presetId);
      toast.success(response.message);
      setActivePreset(response.preset);
      
      // Recargar presets para actualizar estados
      await loadPresets();
      
      // Callback
      if (onEventActivated) {
        onEventActivated(response.preset);
      }
    } catch (error) {
      console.error('Error activating preset:', error);
      toast.error('Error al activar evento');
    }
  };

  // Duplicar preset
  const handleDuplicate = async (presetId: string, name: string) => {
    try {
      const newName = `${name} (Copia)`;
      await photoboothAPI.presets.duplicate(presetId, newName);
      toast.success('Evento duplicado');
      await loadPresets();
    } catch (error) {
      console.error('Error duplicating preset:', error);
      toast.error('Error al duplicar evento');
    }
  };

  // Eliminar preset
  const handleDelete = async (presetId: string) => {
    try {
      await photoboothAPI.presets.delete(presetId);
      toast.success('Evento eliminado');
      await loadPresets();
      setPresetToDelete(null);
    } catch (error: any) {
      console.error('Error deleting preset:', error);
      const message = error.response?.data?.detail || 'Error al eliminar evento';
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Cargando eventos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con botón de crear */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Eventos</h2>
          <p className="text-muted-foreground mt-1">
            Guarda configuraciones completas para diferentes tipos de eventos
          </p>
        </div>
        <Button 
          size="lg" 
          className="gap-2"
          onClick={() => {
            setEditingPreset(null);
            setIsDialogOpen(true);
          }}
        >
          <Plus className="w-5 h-5" />
          Nuevo Evento
        </Button>
      </div>

      {/* Evento activo - destacado */}
      {activePreset && (
        <Card className="border-2 border-primary bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl">{activePreset.name}</CardTitle>
                    <Badge variant="default" className="gap-1">
                      <Play className="w-3 h-3" />
                      ACTIVO
                    </Badge>
                  </div>
                  <CardDescription className="mt-1">
                    {activePreset.event_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(activePreset.event_date).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>
              <Badge 
                className={`${EVENT_TYPE_COLORS[activePreset.event_type]} border text-sm px-3 py-1`}
                variant="outline"
              >
                {EVENT_TYPE_LABELS[activePreset.event_type]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {/* Config rápida */}
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{activePreset.photos_to_take}</div>
                <div className="text-xs text-muted-foreground">Fotos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{activePreset.countdown_seconds}s</div>
                <div className="text-xs text-muted-foreground">Countdown</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{activePreset.auto_reset_seconds}s</div>
                <div className="text-xs text-muted-foreground">Auto-reset</div>
              </div>
              <div className="text-center">
                {activePreset.template_name ? (
                  <>
                    <ImageIcon className="w-6 h-6 mx-auto text-primary" />
                    <div className="text-xs text-muted-foreground truncate">{activePreset.template_name}</div>
                    {getTemplateLayoutLabel(activePreset.template_layout) && (
                      <div className="text-[10px] text-muted-foreground">
                        {getTemplateLayoutLabel(activePreset.template_layout)}
                      </div>
                    )}
                    {getFilterLabel(activePreset.photo_filter) && (
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {getFilterLabel(activePreset.photo_filter)}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-muted-foreground">—</div>
                    <div className="text-xs text-muted-foreground">Sin template</div>
                  </>
                )}
              </div>
            </div>

            {activePreset.notes && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">{activePreset.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lista de eventos guardados */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Eventos Guardados ({presets.length})</h3>
        
        {presets.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay eventos guardados</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                Crea tu primer evento para guardar configuraciones completas y activarlas en 1 click
              </p>
              <Button 
                className="gap-2"
                onClick={() => {
                  setEditingPreset(null);
                  setIsDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4" />
                Crear Primer Evento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {presets.map((preset) => (
              <Card 
                key={preset.id}
                className={`transition-all hover:shadow-lg ${
                  preset.is_active ? 'border-primary' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base">{preset.name}</CardTitle>
                        {preset.is_default && (
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <Star className="w-3 h-3 fill-current" />
                            Base
                          </Badge>
                        )}
                      </div>
                      {preset.event_date && (
                        <CardDescription className="flex items-center gap-1 text-xs">
                          <Calendar className="w-3 h-3" />
                          {new Date(preset.event_date).toLocaleDateString('es-MX')}
                        </CardDescription>
                      )}
                    </div>
                    <Badge 
                      className={`${EVENT_TYPE_COLORS[preset.event_type]} border text-xs px-2`}
                      variant="outline"
                    >
                      {EVENT_TYPE_LABELS[preset.event_type].split(' ')[0]}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* Stats mini */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <div className="font-semibold">{preset.photos_to_take}</div>
                      <div className="text-muted-foreground">fotos</div>
                    </div>
                    <div>
                      <div className="font-semibold">{preset.countdown_seconds}s</div>
                      <div className="text-muted-foreground">count</div>
                    </div>
                    <div>
                      {preset.template_name ? (
                        <>
                          <ImageIcon className="w-4 h-4 mx-auto" />
                          <div className="text-muted-foreground truncate">
                            {getTemplateLayoutLabel(preset.template_layout) || 'template'}
                          </div>
                          {getFilterLabel(preset.photo_filter) && (
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {getFilterLabel(preset.photo_filter)}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="font-semibold">—</div>
                          <div className="text-muted-foreground">template</div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2">
                    {!preset.is_active ? (
                      <Button 
                        className="flex-1 gap-1"
                        onClick={() => handleActivate(preset.id)}
                        size="sm"
                      >
                        <Play className="w-3 h-3" />
                        Activar
                      </Button>
                    ) : (
                      <div className="flex-1 flex items-center justify-center gap-1 text-xs font-medium text-primary">
                        <Check className="w-3 h-3" />
                        Activo
                      </div>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setEditingPreset(preset);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDuplicate(preset.id, preset.name)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    
                    {!preset.is_default && !preset.is_active && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setPresetToDelete(preset.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar evento?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Se eliminará permanentemente "{preset.name}". Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setPresetToDelete(null)}>
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(preset.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Info helper */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">💡 Cómo usar Eventos</h4>
              <p className="text-sm text-muted-foreground">
                1. Configura tus templates en la pestaña "Templates"<br />
                2. Crea un evento y selecciona el template a usar<br />
                3. Activa el evento cuando lo necesites<br />
                ¡Todo se aplica automáticamente!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Dialog Simple */}
      <EventDialogSimple
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingPreset={editingPreset}
        onSuccess={loadPresets}
      />
    </div>
  );
}
