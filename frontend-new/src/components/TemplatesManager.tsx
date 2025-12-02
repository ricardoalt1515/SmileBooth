/**
 * TemplatesManager
 * Manages photo booth templates (layouts + designs)
 * 
 * Principles applied:
 * - DRY: Reusable components and functions
 * - Fail fast: Immediate validation
 * - Good names: Clear, descriptive variables
 * - Single purpose: Each function does one thing
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Palette,
  Check,
  Edit2,
  Trash2,
  Upload,
  Layers,
} from 'lucide-react';
import { useToastContext } from '../contexts/ToastContext';
import photoboothAPI from '../services/api';
import {
  Template,
  TemplatesListResponse,
  LAYOUT_LABELS,
  DESIGN_POSITION_LABELS,
  getLayoutPhotoCount,
  OVERLAY_MODE_FREE,
} from '../types/template';
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
} from '@/components/ui/alert-dialog';
import TemplateDialog from './TemplateDialog';

// Constants - Avoid magic numbers
const PREVIEW_PLACEHOLDER_COLOR = '#e5e7eb';
const ACTIVE_TEMPLATE_BORDER_COLOR = 'border-2 border-primary';
// Fotos demo persistidas en disco (se crean en backend/app/services/demo_assets.py)
const DEMO_PHOTOS = [
  '/data/demo/demo1.jpg',
  '/data/demo/demo2.jpg',
  '/data/demo/demo3.jpg',
  '/data/demo/demo4.jpg',
];

interface TemplatesManagerProps {
  onTemplateActivated?: (template: Template) => void;
}

export default function TemplatesManager({ onTemplateActivated }: TemplatesManagerProps) {
  // State - Single purpose per variable
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [previewMap, setPreviewMap] = useState<Record<string, string>>({});
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [demoPhotos, setDemoPhotos] = useState<string[]>(DEMO_PHOTOS);
  const [duplicateTemplateId, setDuplicateTemplateId] = useState<string | null>(null);
  
  const toast = useToastContext();

  // Load templates - Returns nothing, updates state
  const loadTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      const data: TemplatesListResponse = await photoboothAPI.templates.list();
      setTemplates(data.templates);
      setActiveTemplate(data.active_template || null);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Error cargando templates');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Load on mount
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Load demo photos once; fallback to in-memory placeholders
  useEffect(() => {
    // Usar fotos demo fijas; si en el futuro se quiere personalizar,
    // añadir aquí un selector explícito en la UI.
    setDemoPhotos(DEMO_PHOTOS);
  }, []);

  // Generate previews; si las fotos demo no son rutas en disco, usamos placeholders
  useEffect(() => {
    const generatePreviews = async () => {
      if (!templates.length || !demoPhotos.length) return;

      // Si los demo no son rutas en disco, intentamos usar las rutas fijas por defecto
      const allArePaths = demoPhotos.every((p) => p.startsWith('/'));
      const basePhotos = allArePaths ? demoPhotos : DEMO_PHOTOS;

      // Verificamos que al menos una ruta parezca válida
      if (!basePhotos.length) {
        setPreviewMap({});
        return;
      }

      setIsGeneratingPreview(true);
      const previewEntries: Record<string, string> = {};
      const needs = (layout: string) => getLayoutPhotoCount(layout as any);

      const previewPromises = templates.map(async (tpl) => {
        try {
          const required = needs(tpl.layout);
          const effectivePhotos = Array.from({ length: required }, (_, idx) =>
            basePhotos[idx % basePhotos.length]
          );

          const url = await photoboothAPI.image.previewStrip({
            photo_paths: effectivePhotos,
            design_path: tpl.design_file_path ?? null,
            layout: tpl.layout,
            design_position: tpl.design_position,
            background_color: tpl.background_color,
            photo_spacing: tpl.photo_spacing,
            photo_filter: tpl.photo_filter as any,
            design_scale: tpl.design_scale ?? null,
            design_offset_x: tpl.design_offset_x ?? null,
            design_offset_y: tpl.design_offset_y ?? null,
            overlay_mode: tpl.overlay_mode ?? OVERLAY_MODE_FREE,
            design_stretch: tpl.design_stretch ?? false,
            photo_aspect_ratio: (tpl as any).photo_aspect_ratio ?? 'auto',
          });
          return { id: tpl.id, url };
        } catch (error) {
          console.warn('No se pudo generar preview para template', tpl.id, error);
          return null;
        }
      });

      const results = await Promise.all(previewPromises);
      for (const result of results) {
        if (result && result.url) {
          previewEntries[result.id] = result.url;
        }
      }

      setPreviewMap(previewEntries);
      setIsGeneratingPreview(false);
    };

    generatePreviews();
  }, [templates, demoPhotos]);

  // Handler: Activate template
  const handleActivate = async (templateId: string, templateName: string) => {
    try {
      const response = await photoboothAPI.templates.activate(templateId);
      toast.success(`Template "${templateName}" activado`);
      
      // Reload to get updated state
      await loadTemplates();
      
      // Callback if provided
      if (onTemplateActivated && response.template) {
        onTemplateActivated(response.template);
      }
    } catch (error) {
      console.error('Error activating template:', error);
      toast.error('Error al activar template');
    }
  };

  // Handler: Delete template
  const handleDelete = async () => {
    if (!templateToDelete) return;

    try {
      await photoboothAPI.templates.delete(templateToDelete);
      toast.success('Template eliminado');
      await loadTemplates();
      setIsDeleteDialogOpen(false);
      setTemplateToDelete(null);
    } catch (error: any) {
      console.error('Error deleting template:', error);

      // Show specific error message from backend if available
      const errorMessage = error?.response?.data?.detail ||
                          error?.response?.data?.message ||
                          error?.message ||
                          'Error al eliminar template';

      toast.error(errorMessage);
    }
  };

  // Helper: Get photo count display
  const getPhotoCountDisplay = (layout: string): string => {
    const count = getLayoutPhotoCount(layout as any);
    return `${count} ${count === 1 ? 'foto' : 'fotos'}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Diseños</h2>
          <p className="text-muted-foreground mt-1">
            Paso 1: elige o crea el diseño que se usará en la cabina (layout + marco + posición).
          </p>
        </div>
        <Button 
          size="lg" 
          className="gap-2"
          onClick={() => {
            setEditingTemplate(null);
            setIsTemplateDialogOpen(true);
          }}
        >
          <Plus className="w-5 h-5" />
          Nuevo Diseño
        </Button>
      </div>

      {/* Active Template */}
      {activeTemplate && (
        <Card className={ACTIVE_TEMPLATE_BORDER_COLOR}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="gap-1">
                  <Check className="w-3 h-3" />
                  Activo
                </Badge>
                <CardTitle>{activeTemplate.name}</CardTitle>
              </div>
            </div>
            <CardDescription>
              {LAYOUT_LABELS[activeTemplate.layout]} • {getPhotoCountDisplay(activeTemplate.layout)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {/* Template Info */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Layout:</span>
                  <span className="font-medium">{LAYOUT_LABELS[activeTemplate.layout]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Diseño:</span>
                  <span className="font-medium">
                    {DESIGN_POSITION_LABELS[activeTemplate.design_position]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Espaciado:</span>
                  <span className="font-medium">{activeTemplate.photo_spacing}px</span>
                </div>
              </div>

              {/* Preview */}
              <div className="flex items-center justify-center">
                {activeTemplate.design_file_path ? (
                  <img
                    src={photoboothAPI.templates.getPreview(activeTemplate.id)}
                    alt={activeTemplate.name}
                    className="max-h-32 rounded-lg border"
                  />
                ) : (
                  <div 
                    className="w-24 h-32 rounded-lg border-2 border-dashed flex items-center justify-center"
                    style={{ backgroundColor: PREVIEW_PLACEHOLDER_COLOR }}
                  >
                    <Palette className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates List */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Diseños Disponibles ({templates.length})</h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : templates.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Layers className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay diseños</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                Crea tu primer diseño para definir el layout y aspecto de tus impresiones
              </p>
              <Button 
                className="gap-2"
                onClick={() => {
                  setEditingTemplate(null);
                  setIsTemplateDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4" />
                Crear Primer Diseño
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {templates.map((template) => (
              <Card 
                key={template.id}
                className={template.is_active ? ACTIVE_TEMPLATE_BORDER_COLOR : ''}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    {template.is_active && (
                      <Badge variant="default" className="gap-1">
                        <Check className="w-3 h-3" />
                        Activo
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    {LAYOUT_LABELS[template.layout]}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Preview real con fotos de demo */}
                  <div className="mb-4 flex items-center justify-center">
                    <div className="relative">
                      {previewMap[template.id] ? (
                        <>
                          <img
                            src={previewMap[template.id]}
                            alt={template.name}
                            className="max-h-32 rounded border"
                          />
                          <div className="pointer-events-none absolute inset-0 border border-dashed border-white/60 rounded" aria-label="Guías de corte" />
                        </>
                      ) : isGeneratingPreview ? (
                        <div className="w-24 h-32 flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded">
                          Generando preview...
                        </div>
                      ) : template.design_file_path ? (
                        <img
                          src={photoboothAPI.templates.getPreview(template.id)}
                          alt={template.name}
                          className="max-h-32 rounded border object-contain bg-white"
                        />
                      ) : (
                        <div 
                          className="w-20 h-28 rounded border-2 border-dashed flex items-center justify-center"
                          style={{ backgroundColor: PREVIEW_PLACEHOLDER_COLOR }}
                        >
                          <Palette className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-1 text-xs mb-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fotos:</span>
                      <span>{getPhotoCountDisplay(template.layout)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Posición:</span>
                      <span>{DESIGN_POSITION_LABELS[template.design_position]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Espaciado:</span>
                      <span>{template.photo_spacing}px</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {!template.is_active ? (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleActivate(template.id, template.name)}
                      >
                        <Check className="w-3 h-3 mr-1" />
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
                        setEditingTemplate(template);
                        setIsTemplateDialogOpen(true);
                      }}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        setDuplicateTemplateId(template.id);
                        try {
                          const copy = await photoboothAPI.templates.duplicate(template.id);
                          toast.success(`Template duplicado: ${copy.name}`);
                          await loadTemplates();
                        } catch (error) {
                          console.error('Error duplicando template:', error);
                          toast.error('No se pudo duplicar el template');
                        } finally {
                          setDuplicateTemplateId(null);
                        }
                      }}
                      disabled={Boolean(duplicateTemplateId)}
                      title="Duplicar template"
                    >
                      <Upload className="w-3 h-3" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={template.is_active}
                      onClick={() => {
                        setTemplateToDelete(template.id);
                        setIsDeleteDialogOpen(true);
                      }}
                      title={template.is_active ? 'No puedes eliminar un template activo. Desactívalo primero.' : 'Eliminar template'}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Info Card */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">💡 Flujo recomendado</h4>
              <p className="text-sm text-muted-foreground">
                1. Crea un diseño con el layout deseado (3x1, 4x1, etc.) y su filtro.<br />
                2. Sube tu diseño de Canva (PNG) y actívalo como diseño actual.<br />
                3. Ve a la pestaña <strong>General</strong> para definir cuántas fotos, countdown y audio.<br />
                4. Cierra configuración y prueba la cabina.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Dialog */}
      <TemplateDialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
        onSuccess={loadTemplates}
        editingTemplate={editingTemplate}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar template?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El template y su diseño asociado serán eliminados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTemplateToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
