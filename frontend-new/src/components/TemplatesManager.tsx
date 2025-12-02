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
  PHOTO_ASPECT_RATIO_LABELS,
  getLayoutPhotoCount,
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
const MAX_CONCURRENT_PREVIEWS = 6; // Increased from 3 for faster loading
const MAX_CACHE_SIZE = 50; // Prevent unbounded memory growth

// Fotos demo persistidas en disco (se crean en backend/app/services/demo_assets.py)
const DEMO_PHOTOS = [
  '/data/demo/demo1.jpg',
  '/data/demo/demo2.jpg',
  '/data/demo/demo3.jpg',
  '/data/demo/demo4.jpg',
];

// Cache singleton - Lives outside component (persists across renders)
// Purpose: Avoid regenerating previews for templates we've seen before
const PREVIEW_CACHE = new Map<string, string>();

/**
 * Get or generate preview for a template.
 * Returns cached URL if available, generates otherwise.
 *
 * Fail Fast: Returns immediately on cache hit.
 *
 * @param template - Template to preview
 * @param demoPhotos - Demo photos for preview generation
 * @returns Promise<string> Preview URL (base64 data URL)
 */
async function getOrGeneratePreview(
  template: Template,
  demoPhotos: string[]
): Promise<string> {
  const cacheKey = template.id;

  // Return cached if available - Fail fast on cache hit
  if (PREVIEW_CACHE.has(cacheKey)) {
    return PREVIEW_CACHE.get(cacheKey)!;
  }

  // Generate preview (original logic)
  const photoCount = getLayoutPhotoCount(template.layout);
  const photoPaths = Array.from({ length: photoCount }, (_, i) =>
    demoPhotos[i % demoPhotos.length]
  );

  const previewUrl = await photoboothAPI.image.previewStrip({
    photo_paths: photoPaths,
    design_path: template.design_file_path,
    layout: template.layout,
    design_position: template.design_position,
    background_color: template.background_color,
    photo_spacing: template.photo_spacing,
    photo_filter: template.photo_filter,
    design_scale: template.design_scale ?? null,
    design_offset_x: template.design_offset_x ?? null,
    design_offset_y: template.design_offset_y ?? null,
    overlay_mode: template.overlay_mode ?? null,
    design_stretch: template.design_stretch ?? false,
    photo_aspect_ratio: (template as any).photo_aspect_ratio ?? null,
  });

  // Cache for next time
  PREVIEW_CACHE.set(cacheKey, previewUrl);

  // Cleanup old entries - Keep cache bounded
  if (PREVIEW_CACHE.size > MAX_CACHE_SIZE) {
    const firstKey = PREVIEW_CACHE.keys().next().value;
    if (firstKey !== undefined) {
      PREVIEW_CACHE.delete(firstKey);
    }
  }

  return previewUrl;
}

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

  const handleTemplateDialogSuccess = useCallback(async () => {
    // Cualquier cambio de template (crear/editar) invalida el caché ligero
    // para asegurar que los previews se regeneren con los nuevos datos.
    PREVIEW_CACHE.clear();
    await loadTemplates();
  }, [loadTemplates]);

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

  /**
   * Generate previews for all templates.
   * Uses cache to avoid regenerating seen templates.
   * Processes in batches for better concurrency.
   */
  useEffect(() => {
    // Fail fast - Skip if no templates or no demo photos
    if (templates.length === 0 || demoPhotos.length === 0) {
      setIsGeneratingPreview(false);
      return;
    }

    let cancelled = false;

    async function generatePreviews() {
      try {
        setIsGeneratingPreview(true);
        const newPreviews: Record<string, string> = {};

        // Process templates in batches for better performance
        for (let i = 0; i < templates.length; i += MAX_CONCURRENT_PREVIEWS) {
          if (cancelled) break;

          const batch = templates.slice(i, i + MAX_CONCURRENT_PREVIEWS);

          // Generate batch previews in parallel
          const results = await Promise.all(
            batch.map(async (tpl) => {
              try {
                const url = await getOrGeneratePreview(tpl, demoPhotos);
                return { id: tpl.id, url };
              } catch (error) {
                console.error(`Error generating preview for ${tpl.name}:`, error);
                return { id: tpl.id, url: '' };
              }
            })
          );

          // Accumulate results
          results.forEach(({ id, url }) => {
            if (url) newPreviews[id] = url;
          });
        }

        if (!cancelled) {
          setPreviewMap((prev) => ({ ...prev, ...newPreviews }));
        }
      } catch (error) {
        console.error('Error generating previews:', error);
        toast.error('Error generando previews');
      } finally {
        if (!cancelled) {
          setIsGeneratingPreview(false);
        }
      }
    }

    generatePreviews();

    return () => {
      cancelled = true;
    };
  }, [templates, demoPhotos, toast]);

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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Forma de foto:</span>
                  <span className="font-medium">
                    {PHOTO_ASPECT_RATIO_LABELS[(activeTemplate.photo_aspect_ratio ?? 'auto') as keyof typeof PHOTO_ASPECT_RATIO_LABELS]}
                  </span>
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
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Forma de foto:</span>
                      <span>
                        {PHOTO_ASPECT_RATIO_LABELS[(template.photo_aspect_ratio ?? 'auto') as keyof typeof PHOTO_ASPECT_RATIO_LABELS]}
                      </span>
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
        onSuccess={handleTemplateDialogSuccess}
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
