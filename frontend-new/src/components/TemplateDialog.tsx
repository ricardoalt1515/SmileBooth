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
import photoboothAPI, { API_BASE_URL } from '../services/api';
import {
  Template,
  TemplateCreate,
  LayoutType,
  DesignPositionType,
  OverlayModeType,
  LAYOUT_LABELS,
  DESIGN_POSITION_LABELS,
  LAYOUT_3X1_VERTICAL,
  LAYOUT_4X1_VERTICAL,
  LAYOUT_2X2_GRID,
  DESIGN_POSITION_BOTTOM,
  DESIGN_POSITION_TOP,
  OVERLAY_MODE_FREE,
  OVERLAY_MODE_FOOTER,
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
const ENABLE_LIVE_PREVIEW = true; // Toggle para pedir preview real al backend
const TARGET_RATIO = 4 / 3; // 600x450 en backend
const RATIO_TOLERANCE = 0.5; // Relajado para aceptar proporciones similares
const SUPPORTED_POSITIONS: DesignPositionType[] = ['top', 'bottom'];
const MIN_DESIGN_SCALE = 0.3; // 30 % del ancho del strip
const MAX_DESIGN_SCALE = 1.0; // 100 % del ancho del strip
const DEFAULT_DESIGN_SCALE = 1.0;
const DEFAULT_OFFSET_X = 0.5; // Centro horizontal
const DEFAULT_OFFSET_Y_TOP = 0.2;
const DEFAULT_OFFSET_Y_BOTTOM = 0.8;
const FOOTER_HEIGHT_RATIO = 0.18; // Debe mantenerse razonablemente alineado con backend
// Fotos demo persistidas en disco para que el backend pueda generar preview real
// Se crean en backend/app/services/demo_assets.py y viven bajo /data/demo/
const DEMO_PHOTOS = [
  '/data/demo/demo1.jpg',
  '/data/demo/demo2.jpg',
  '/data/demo/demo3.jpg',
  '/data/demo/demo4.jpg',
];

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
  overlay_mode: OverlayModeType;
  background_color: string;
  photo_spacing: number;
  photo_filter: 'none' | 'bw' | 'sepia' | 'glam';
  // Overlay controls para el diseño (normalizados)
  design_scale: number; // 0-1, relativo al ancho del strip
  design_offset_x: number; // 0-1, centro horizontal
  design_offset_y: number; // 0-1, centro vertical
  design_stretch: boolean;
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
  const previewStripRef = useRef<HTMLDivElement | null>(null);
  const previewImageRef = useRef<HTMLImageElement | null>(null);
  // Form state - Single purpose per variable
  const [formData, setFormData] = useState<FormData>(getInitialFormData());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // State separation: Design (input) vs Strip (output)
  const [designPreviewUrl, setDesignPreviewUrl] = useState<string | null>(null); // visual del archivo subido/existente
  const [designPreviewPath, setDesignPreviewPath] = useState<string | null>(null); // ruta servible (/data/...) para backend
  const [stripPreviewUrl, setStripPreviewUrl] = useState<string | null>(null); // strip generado por backend

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [demoPhotos, setDemoPhotos] = useState<string[]>(DEMO_PHOTOS);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isOverlayDragging, setIsOverlayDragging] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Formats definition
  const PRINT_FORMATS = [
    {
      id: 'classic',
      label: 'Tira Clásica (3 fotos)',
      layout: LAYOUT_3X1_VERTICAL,
      overlay_mode: OVERLAY_MODE_FREE,
      description: 'Diseño limpio con 3 fotos verticales.'
    },
    {
      id: 'footer',
      label: 'Tira con Logo (3 fotos + Footer)',
      layout: LAYOUT_3X1_VERTICAL,
      overlay_mode: OVERLAY_MODE_FOOTER,
      description: '3 fotos con espacio dedicado abajo para tu marca.'
    },
    {
      id: '4photo',
      label: 'Tira de 4 fotos',
      layout: LAYOUT_4X1_VERTICAL,
      overlay_mode: OVERLAY_MODE_FREE,
      description: '4 fotos verticales aprovechando todo el espacio.'
    },
    {
      id: 'grid',
      label: 'Postal (Grid 2x2)',
      layout: LAYOUT_2X2_GRID,
      overlay_mode: OVERLAY_MODE_FREE,
      description: '4 fotos en cuadrícula estilo postal.'
    }
  ] as const;

  // Helper: Get initial form data - Single source of truth
  function getInitialFormData(): FormData {
    return {
      name: '',
      layout: LAYOUT_3X1_VERTICAL,
      design_position: DESIGN_POSITION_BOTTOM,
      overlay_mode: OVERLAY_MODE_FREE,
      background_color: DEFAULT_BACKGROUND_COLOR,
      photo_spacing: DEFAULT_PHOTO_SPACING,
      photo_filter: 'none',
      design_scale: DEFAULT_DESIGN_SCALE,
      design_offset_x: DEFAULT_OFFSET_X,
      design_offset_y: DEFAULT_OFFSET_Y_BOTTOM,
      design_stretch: false,
    };
  }

  // Initialize form when editing template
  useEffect(() => {

    if (editingTemplate) {
      setFormData({
        name: editingTemplate.name,
        layout: editingTemplate.layout,
        design_position: editingTemplate.design_position,
        overlay_mode: editingTemplate.overlay_mode ?? OVERLAY_MODE_FREE,
        background_color: editingTemplate.background_color,
        photo_spacing: editingTemplate.photo_spacing,
        photo_filter: (editingTemplate.photo_filter as FormData['photo_filter']) || 'none',
        design_scale: editingTemplate.design_scale ?? DEFAULT_DESIGN_SCALE,
        design_offset_x: editingTemplate.design_offset_x ?? DEFAULT_OFFSET_X,
        design_offset_y:
          editingTemplate.design_offset_y ??
          (editingTemplate.design_position === DESIGN_POSITION_TOP
            ? DEFAULT_OFFSET_Y_TOP
            : DEFAULT_OFFSET_Y_BOTTOM),
        design_stretch: editingTemplate.design_stretch ?? false,
      });

      // Set preview if has design
      if (editingTemplate.design_file_path) {
        setDesignPreviewUrl(`${API_BASE_URL}${editingTemplate.design_file_path}`);
        setDesignPreviewPath(editingTemplate.design_file_path);
      } else {
        setDesignPreviewUrl(null);
        setDesignPreviewPath(null);
      }
      setStripPreviewUrl(null);
    } else {
      setFormData(getInitialFormData());
      setDesignPreviewUrl(null);
      setDesignPreviewPath(null);
      setStripPreviewUrl(null);
    }
    setSelectedFile(null);
    setErrors([]);
  }, [editingTemplate, open]);

  // Load demo photos once to render real previews (fallback a placeholders si no hay)
  useEffect(() => {
    // Usar fotos de demo estáticas para evitar confusión con fotos reales del usuario
    setDemoPhotos(DEMO_PHOTOS);
  }, []);

  // Evitar que arrastrar/soltar abra el archivo en la ventana (especialmente en Electron)
  useEffect(() => {
    const preventDefault = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('dragover', preventDefault);
    window.addEventListener('drop', preventDefault);
    return () => {
      window.removeEventListener('dragover', preventDefault);
      window.removeEventListener('drop', preventDefault);
    };
  }, []);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (designPreviewUrl && designPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(designPreviewUrl);
      }
      // stripPreviewUrl usually comes from backend (base64 or url), but if it was a blob we'd clean it too
    };
  }, [designPreviewUrl]);

  // Render real preview using demo photos (reusing them if layout necesita más)
  useEffect(() => {
    if (!ENABLE_LIVE_PREVIEW) {
      setStripPreviewUrl(null);
      return;
    }

    const needs = getLayoutPhotoCount(formData.layout);

    // Sin fotos demo no podemos generar preview real
    if (!demoPhotos.length) {
      return;
    }

    // Asegurar que siempre tengamos suficientes rutas válidas reutilizando las demos
    const allArePaths = demoPhotos.every((p) => p.startsWith('/'));
    const basePhotos = allArePaths ? demoPhotos : DEMO_PHOTOS;

    const effectivePhotos = Array.from({ length: needs }, (_, idx) =>
      basePhotos[idx % basePhotos.length]
    );

    const demoArePaths = effectivePhotos.every((p) => p.startsWith('/'));
    if (!demoArePaths) {
      setStripPreviewUrl(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoadingPreview(true);
        const previewImage = await photoboothAPI.image.previewStrip({
          photo_paths: effectivePhotos,
          design_path: designPreviewPath ?? editingTemplate?.design_file_path ?? null,
          layout: formData.layout,
          design_position: formData.design_position,
          background_color: formData.background_color,
          photo_spacing: formData.photo_spacing,
          photo_filter: formData.photo_filter,
          design_scale: formData.design_scale,
          design_offset_x: formData.design_offset_x,
          design_offset_y: formData.design_offset_y,
          overlay_mode: formData.overlay_mode,
          design_stretch: formData.design_stretch,
        });
        setStripPreviewUrl(previewImage);
      } catch (error) {
        console.error('Error generando preview real:', error);
        setStripPreviewUrl(null);
      } finally {
        setIsLoadingPreview(false);
      }
    }, 800); // Increased debounce to reduce flickering

    return () => clearTimeout(timer);
  }, [formData, demoPhotos, editingTemplate, designPreviewPath]);

  const updateOverlayPositionFromPoint = useCallback((clientX: number, clientY: number) => {
    const container = previewStripRef.current;
    if (!container) return;

    const imageEl = previewImageRef.current;
    const rect = (imageEl ?? container).getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }

    const normX = (clientX - rect.left) / rect.width;
    const normY = (clientY - rect.top) / rect.height;
    const clampedX = Math.min(1, Math.max(0, normX));
    const clampedY = Math.min(1, Math.max(0, normY));

    setFormData((prev) => {
      const overlayMode = prev.overlay_mode;

      if (overlayMode === OVERLAY_MODE_FOOTER) {
        const footerStart = 1 - FOOTER_HEIGHT_RATIO;
        // Forzar el punto dentro de la banda inferior
        const withinFooter = Math.min(1, Math.max(footerStart, clampedY));
        const relative = FOOTER_HEIGHT_RATIO > 0
          ? (withinFooter - footerStart) / FOOTER_HEIGHT_RATIO
          : 0;
        const relativeClamped = Math.min(1, Math.max(0, relative));

        return {
          ...prev,
          design_offset_x: clampedX,
          design_offset_y: relativeClamped,
        };
      }

      return {
        ...prev,
        design_offset_x: clampedX,
        design_offset_y: clampedY,
      };
    });
  }, []);

  const handleOverlayDragStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isSubmitting) return;
    e.preventDefault();
    e.stopPropagation();
    setIsOverlayDragging(true);
    updateOverlayPositionFromPoint(e.clientX, e.clientY);
  }, [isSubmitting, updateOverlayPositionFromPoint]);

  const handleOverlayTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (isSubmitting) return;
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    if (!touch) return;
    setIsOverlayDragging(true);
    updateOverlayPositionFromPoint(touch.clientX, touch.clientY);
  }, [isSubmitting, updateOverlayPositionFromPoint]);

  useEffect(() => {
    if (!isOverlayDragging) return;

    const handleMouseMove = (event: MouseEvent) => {
      event.preventDefault();
      updateOverlayPositionFromPoint(event.clientX, event.clientY);
    };

    const handleMouseUp = () => {
      setIsOverlayDragging(false);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!event.touches.length) return;
      const touch = event.touches[0];
      updateOverlayPositionFromPoint(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = () => {
      setIsOverlayDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isOverlayDragging, updateOverlayPositionFromPoint]);

  const handleResetDesignAuto = useCallback(() => {
    setFormData((prev) => {
      // Smart Default Logic:
      // - Footer Mode: Scale 0.8 (80%) to leave safe margin. No stretch.
      // - Free Mode: Scale 1.0 (100%) and Stretch (assuming full frame).
      const isFooter = prev.overlay_mode === OVERLAY_MODE_FOOTER;

      return {
        ...prev,
        design_scale: isFooter ? 0.8 : 1.0,
        design_offset_x: DEFAULT_OFFSET_X,
        design_offset_y: prev.design_position === DESIGN_POSITION_TOP ? DEFAULT_OFFSET_Y_TOP : DEFAULT_OFFSET_Y_BOTTOM,
        design_stretch: !isFooter, // Auto-stretch for free mode (frames), safe margin for footer
      };
    });
  }, []);

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

  const validateImageDimensions = useCallback(async (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        const ratioDiff = Math.abs(ratio - TARGET_RATIO);
        if (ratioDiff > RATIO_TOLERANCE) {
          const actualRatioText = (ratio).toFixed(2);
          const targetRatioText = TARGET_RATIO.toFixed(2);
          resolve(
            `La imagen tiene proporción ${actualRatioText}:1 (${img.width}x${img.height}). ` +
            `Se recomienda proporción ${targetRatioText}:1 (ej. 1200x900, 800x600). ` +
            `El backend la redimensionará automáticamente a 600x450.`
          );
          return;
        }
        resolve(null);
      };
      img.onerror = () => resolve('No se pudo leer la imagen. Intenta con otro archivo.');
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Handler: File selection
  const handleFileSelect = useCallback(async (file: File) => {
    // Validate file - Fail fast
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    const dimensionError = await validateImageDimensions(file);
    if (dimensionError) {
      toast.error(dimensionError);
      return;
    }

    // Set file and create preview
    setSelectedFile(file);

    // Revoke old preview URL
    if (designPreviewUrl && designPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(designPreviewUrl);
    }

    // Create new preview URL for the DESIGN FILE
    const newPreviewUrl = URL.createObjectURL(file);
    setDesignPreviewUrl(newPreviewUrl);

    // Subir diseño temporal para que el backend pueda generar preview real
    try {
      setIsLoadingPreview(true);
      const path = await photoboothAPI.image.uploadDesignPreview(file);
      setDesignPreviewPath(path);
    } catch (uploadErr) {
      console.error('No se pudo subir diseño temporal:', uploadErr);
      setDesignPreviewPath(null);
    } finally {
      setIsLoadingPreview(false);
    }
  }, [validateFile, validateImageDimensions, toast, designPreviewUrl]);

  // Handler: Drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Handler: Remove file
  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    if (designPreviewUrl && designPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(designPreviewUrl);
    }
    if (editingTemplate?.design_file_path) {
      setDesignPreviewUrl(photoboothAPI.templates.getPreview(editingTemplate.id));
      setDesignPreviewPath(editingTemplate.design_file_path);
    } else {
      setDesignPreviewUrl(null);
      setDesignPreviewPath(null);
    }
  }, [designPreviewUrl, editingTemplate]);

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
        await photoboothAPI.templates.update(editingTemplate.id, {
          name: formData.name,
          layout: formData.layout,
          design_position: formData.design_position,
          overlay_mode: formData.overlay_mode,
          background_color: formData.background_color,
          photo_spacing: formData.photo_spacing,
          photo_filter: formData.photo_filter,
          design_scale: formData.design_scale,
          design_offset_x: formData.design_offset_x,
          design_offset_y: formData.design_offset_y,
          design_stretch: formData.design_stretch,
        });
        templateId = editingTemplate.id;
        toast.success('Template actualizado');
      } else {
        // Create new template
        const templateData: TemplateCreate = {
          name: formData.name,
          layout: formData.layout,
          design_position: formData.design_position,
          overlay_mode: formData.overlay_mode,
          background_color: formData.background_color,
          photo_spacing: formData.photo_spacing,
          photo_filter: formData.photo_filter,
          design_scale: formData.design_scale,
          design_offset_x: formData.design_offset_x,
          design_offset_y: formData.design_offset_y,
          design_stretch: formData.design_stretch,
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
      setDesignPreviewUrl(null);
      setDesignPreviewPath(null);
      setStripPreviewUrl(null);

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

  const clampedDesignScale = Math.min(
    MAX_DESIGN_SCALE,
    Math.max(MIN_DESIGN_SCALE, formData.design_scale),
  );

  const overlayTopPercent =
    formData.overlay_mode === OVERLAY_MODE_FOOTER
      ? (1 - FOOTER_HEIGHT_RATIO + formData.design_offset_y * FOOTER_HEIGHT_RATIO) * 100
      : formData.design_offset_y * 100;

  // Handler para controlar el cierre del diálogo
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal={true}>
      <DialogContent
        className="!w-[90vw] !max-w-[90vw] !h-[90vh] !max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border-none shadow-2xl bg-background/95 backdrop-blur-xl"
        onKeyDown={(e) => {
          // Prevenir que Space active la cámara cuando estás escribiendo
          if (e.key === ' ' || e.code === 'Space') {
            e.stopPropagation();
          }
        }}
      >
        <DialogHeader className="px-8 py-6 border-b bg-background z-20">
          <DialogTitle className="text-2xl">
            {editingTemplate ? 'Editar Template' : 'Nuevo Template'}
          </DialogTitle>
          <DialogDescription className="text-base">
            Define el layout y diseño para tus impresiones
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-12 h-full">
          {/* COLUMNA IZQUIERDA: Formulario (Scrollable) */}
          <div className="col-span-12 lg:col-span-4 overflow-y-auto p-10 border-r bg-card/50">
            <div className="space-y-10 mx-auto">
              {/* Nombre */}
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

              {/* Arte / Diseño */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">Arte</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sube tu marco/overlay (PNG/JPG, máx {MAX_FILE_SIZE_MB}MB)
                    </p>
                  </div>
                  <Badge variant="secondary" className="px-3 py-1">Se redimensiona a 600x450</Badge>
                </div>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !isSubmitting && fileInputRef.current?.click()}
                  className={`
                    relative overflow-hidden
                    border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                    transition-all duration-300 ease-out
                    ${isDragging
                      ? 'border-primary bg-primary/10 scale-[1.02] shadow-lg'
                      : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50'
                    }
                    ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {isSubmitting ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="text-sm text-muted-foreground">Subiendo diseño...</p>
                    </div>
                  ) : designPreviewUrl ? (
                    <div className="relative group">
                      <img
                        src={designPreviewUrl}
                        alt="Preview"
                        className="max-h-40 mx-auto rounded-lg shadow-sm object-contain"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                        <p className="text-white text-sm font-medium">Cambiar diseño</p>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-8 w-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
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
                      <p className="text-sm">
                        {isLoadingPreview ? 'Generando preview...' : 'Arrastra tu diseño aquí'}
                      </p>
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

              {/* Layout y apariencia */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Layout y apariencia</Label>
                  <Badge variant="outline" className="text-xs">
                    {getPhotoCountDisplay()}
                  </Badge>
                </div>

                {/* Print Format Selector (High Level) */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Formato de Impresión</Label>
                  <div className="grid grid-cols-1 gap-3">
                    {PRINT_FORMATS.map((format) => {
                      const isSelected =
                        formData.layout === format.layout &&
                        formData.overlay_mode === format.overlay_mode;

                      return (
                        <div
                          key={format.id}
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              layout: format.layout,
                              overlay_mode: format.overlay_mode,
                              // Reset design position if needed, or keep current
                            }));
                          }}
                          className={`
                            relative flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-all hover:bg-muted/50
                            ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-muted'}
                          `}
                        >
                          <div className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-primary' : 'border-muted-foreground'}`}>
                            {isSelected && <div className="h-2 w-2 rounded-full bg-primary" />}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">{format.label}</p>
                            <p className="text-xs text-muted-foreground">{format.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Advanced Options Toggle */}
                <div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-xs text-muted-foreground h-8 px-2"
                  >
                    {showAdvanced ? 'Ocultar opciones avanzadas' : 'Mostrar opciones avanzadas (Layout manual)'}
                  </Button>
                </div>

                {/* Advanced Options (Collapsible) */}
                {showAdvanced && (
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-dashed animate-in fade-in slide-in-from-top-2">
                    {/* Layout Selection */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label htmlFor="layout" className="text-sm font-medium">Layout Manual</Label>
                        <Select
                          value={formData.layout}
                          onValueChange={(value: LayoutType) =>
                            setFormData({ ...formData, layout: value })
                          }
                        >
                          <SelectTrigger id="layout" className="w-full h-9">
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
                      </div>

                      {/* Design Position */}
                      <div className="space-y-3">
                        <Label htmlFor="design_position" className="text-sm font-medium">Posición del Diseño</Label>
                        <Select
                          value={formData.design_position}
                          onValueChange={(value: DesignPositionType) =>
                            setFormData({ ...formData, design_position: value })
                          }
                        >
                          <SelectTrigger id="design_position" className="w-full h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(DESIGN_POSITION_LABELS)
                              .filter(([value]) => SUPPORTED_POSITIONS.includes(value as DesignPositionType))
                              .map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Overlay Mode */}
                    <div className="space-y-3">
                      <Label htmlFor="overlay_mode" className="text-sm font-medium">Modo de diseño</Label>
                      <Select
                        value={formData.overlay_mode}
                        onValueChange={(value: OverlayModeType) =>
                          setFormData({ ...formData, overlay_mode: value })
                        }
                      >
                        <SelectTrigger id="overlay_mode" className="w-full h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={OVERLAY_MODE_FREE}>Libre (sobre toda la tira)</SelectItem>
                          <SelectItem value={OVERLAY_MODE_FOOTER}>Logo en pie de página</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Styling Options */}
              <div className="grid grid-cols-2 gap-8">
                {/* Background Color */}
                <div className="space-y-3">
                  <Label htmlFor="background_color" className="text-sm font-medium">Color de Fondo</Label>
                  <div className="flex gap-3">
                    <Input
                      id="background_color"
                      type="color"
                      value={formData.background_color}
                      onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                      className="w-14 h-11 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={formData.background_color}
                      onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                      placeholder="#FFFFFF"
                      className="flex-1 h-11 font-mono"
                    />
                  </div>
                </div>

                {/* Photo Spacing */}
                <div className="space-y-3">
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
                      photo_spacing: parseInt(e.target.value, 10) || DEFAULT_PHOTO_SPACING
                    })}
                    className={`h-11 ${errors.find(e => e.field === 'photo_spacing') ? 'border-destructive' : ''}`}
                  />
                </div>

                {/* Photo Filter */}
                <div className="space-y-3 col-span-2">
                  <Label htmlFor="photo_filter" className="text-sm font-medium">Filtro de fotos</Label>
                  <Select
                    value={formData.photo_filter}
                    onValueChange={(value: FormData['photo_filter']) =>
                      setFormData({ ...formData, photo_filter: value })
                    }
                  >
                    <SelectTrigger id="photo_filter" className="w-full h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin filtro</SelectItem>
                      <SelectItem value="bw">Blanco y negro</SelectItem>
                      <SelectItem value="sepia">Sepia cálido</SelectItem>
                      <SelectItem value="glam">Glam / Belleza suave</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Este filtro se aplicará a las fotos de este diseño en cámara, preview y tira final.
                  </p>
                </div>
              </div>

              {/* Design size & position */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Tamaño y posición del diseño</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[11px] text-muted-foreground"
                      onClick={handleResetDesignAuto}
                    >
                      Restablecer automático
                    </Button>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(formData.design_scale * 100)}%
                    </Badge>
                  </div>
                </div>

                {/* Scale slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="design_scale" className="text-sm font-medium">
                      Tamaño del diseño
                    </Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="design_stretch"
                        checked={formData.design_stretch}
                        onChange={(e) => setFormData({ ...formData, design_stretch: e.target.checked })}
                        className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                      />
                      <Label htmlFor="design_stretch" className="text-xs font-normal cursor-pointer">
                        Llenar zona (Estirar)
                      </Label>
                    </div>
                  </div>
                  <input
                    id="design_scale"
                    type="range"
                    min={MIN_DESIGN_SCALE * 100}
                    max={MAX_DESIGN_SCALE * 100}
                    value={formData.design_scale * 100}
                    disabled={formData.design_stretch}
                    onChange={(e) => {
                      const value = Number(e.target.value) || DEFAULT_DESIGN_SCALE * 100;
                      const scale = Math.min(MAX_DESIGN_SCALE, Math.max(MIN_DESIGN_SCALE, value / 100));
                      setFormData({
                        ...formData,
                        design_scale: scale,
                      });
                    }}
                    className={`w-full cursor-pointer ${formData.design_stretch ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.design_stretch
                      ? 'El diseño se estirará para llenar el espacio disponible.'
                      : 'Ajusta qué tanto ancho ocupa tu arte dentro de la tira.'}
                  </p>
                </div>

                {/* Vertical position slider */}
                <div className="space-y-2">
                  <Label htmlFor="design_offset_y" className="text-sm font-medium">
                    Altura del diseño
                  </Label>
                  <input
                    id="design_offset_y"
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(formData.design_offset_y * 100)}
                    disabled={formData.design_stretch}
                    onChange={(e) => {
                      const value = Number(e.target.value) || 0;
                      const norm = Math.min(1, Math.max(0, value / 100));
                      setFormData({
                        ...formData,
                        design_offset_y: norm,
                      });
                    }}
                    className={`w-full cursor-pointer ${formData.design_stretch ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.overlay_mode === OVERLAY_MODE_FOOTER
                      ? '0% = parte superior de la banda, 100% = borde inferior de la banda.'
                      : '0% = arriba, 100% = abajo. El diseño siempre se mantiene dentro de la tira.'}
                  </p>
                </div>

                {/* Horizontal position slider */}
                <div className="space-y-2">
                  <Label htmlFor="design_offset_x" className="text-sm font-medium">
                    Posición horizontal
                  </Label>
                  <input
                    id="design_offset_x"
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(formData.design_offset_x * 100)}
                    disabled={formData.design_stretch}
                    onChange={(e) => {
                      const value = Number(e.target.value) || 50;
                      const norm = Math.min(1, Math.max(0, value / 100));
                      setFormData({
                        ...formData,
                        design_offset_x: norm,
                      });
                    }}
                    className={`w-full cursor-pointer ${formData.design_stretch ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  <p className="text-xs text-muted-foreground">
                    0% = izquierda, 100% = derecha.
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* FIN COLUMNA IZQUIERDA */}

          {/* COLUMNA DERECHA: Preview Grande (Fixed/Sticky) */}
          <div className="col-span-12 lg:col-span-7 bg-muted/10 p-12 flex flex-col h-full overflow-hidden relative">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }}
            />

            <div className="flex items-center justify-between mb-6 relative z-10">
              <div>
                <Label className="text-xl font-semibold">Vista previa en vivo</Label>
                <p className="text-sm text-muted-foreground">
                  Así se verá tu strip de fotos
                </p>
              </div>
              <Badge variant="outline" className="text-sm px-3 py-1 bg-background">
                {getPhotoCountDisplay()}
              </Badge>
            </div>

            {/* Preview Container - Centered and Scaled */}
            <div className="flex-1 flex items-center justify-center relative z-10 overflow-hidden p-4">
              <div
                ref={previewStripRef}
                className="relative transition-all duration-500 transform hover:scale-[1.01]"
                style={{
                  height: '100%',
                  maxHeight: '800px',
                  aspectRatio: '2/6',
                  backgroundColor: formData.background_color,
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.05)'
                }}
              >
                {stripPreviewUrl ? (
                  <>
                    <div className="absolute inset-0 bg-white animate-in fade-in duration-500">
                      <img
                        ref={previewImageRef}
                        src={stripPreviewUrl}
                        alt="Preview Real"
                        className="w-full h-full object-contain"
                      />
                      {isLoadingPreview && (
                        <div className="absolute top-2 right-2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                    {(designPreviewPath || editingTemplate?.design_file_path) && (
                      <div
                        className={`absolute rounded-lg border-2 border-primary/70 bg-primary/10 shadow-sm cursor-move select-none flex items-center justify-center text-[10px] text-primary-foreground/80 ${isOverlayDragging ? 'ring-2 ring-primary/60' : ''}`}
                        style={formData.design_stretch ? {
                          left: '50%',
                          top: formData.overlay_mode === OVERLAY_MODE_FOOTER
                            ? `${(1 - FOOTER_HEIGHT_RATIO / 2) * 100}%`
                            : '50%',
                          width: '100%',
                          height: formData.overlay_mode === OVERLAY_MODE_FOOTER
                            ? `${FOOTER_HEIGHT_RATIO * 100}%`
                            : '100%',
                          transform: 'translate(-50%, -50%)',
                          aspectRatio: 'unset',
                          pointerEvents: 'none',
                        } : {
                          left: `${formData.design_offset_x * 100}%`,
                          top: `${overlayTopPercent}%`,
                          width: `${clampedDesignScale * 100}%`,
                          transform: 'translate(-50%, -50%)',
                          aspectRatio: '4 / 3',
                          pointerEvents: 'auto',
                        }}
                        onMouseDown={!formData.design_stretch ? handleOverlayDragStart : undefined}
                        onTouchStart={!formData.design_stretch ? handleOverlayTouchStart : undefined}
                      >
                        {!formData.design_stretch && <span>Arrastra para mover</span>}
                      </div>
                    )}
                    {formData.overlay_mode === OVERLAY_MODE_FOOTER && (
                      <div
                        className="pointer-events-none absolute inset-x-6 rounded-t-md border-t border-black/10 bg-black/5"
                        style={{
                          bottom: '6%',
                          height: `${FOOTER_HEIGHT_RATIO * 100}%`,
                        }}
                      />
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
                    {isLoadingPreview ? (
                      <>
                        <Loader2 className="w-12 h-12 animate-spin text-primary" />
                        <div className="text-center">
                          <p className="font-semibold text-lg">Generando preview...</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Esto puede tardar unos segundos
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-center max-w-md">
                          <p className="font-semibold text-lg mb-2">Configura tu template</p>
                          <p className="text-sm text-muted-foreground">
                            Selecciona un diseño, ajusta el layout y el espaciado.
                            El preview se generará automáticamente mostrando exactamente cómo se verá tu strip final.
                          </p>
                        </div>
                        {designPreviewUrl && (
                          <div className="mt-4">
                            <p className="text-xs text-muted-foreground mb-2 text-center">Tu diseño:</p>
                            <img
                              src={designPreviewUrl}
                              alt="Diseño seleccionado"
                              className="max-h-32 rounded-lg shadow-md"
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 p-4 bg-muted rounded-lg relative z-10">
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

        <DialogFooter className="px-8 py-4 border-t bg-background z-20">
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
      </DialogContent >
    </Dialog >
  );
}
