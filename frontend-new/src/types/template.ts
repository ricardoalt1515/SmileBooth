/**
 * Template Types
 * Defines TypeScript types for photo booth templates
 * 
 * A Template = Layout + Design + Positioning
 */

// Constants - Avoid magic strings
export const LAYOUT_3X1_VERTICAL = '3x1-vertical' as const;
export const LAYOUT_4X1_VERTICAL = '4x1-vertical' as const;
export const LAYOUT_6X1_VERTICAL = '6x1-vertical' as const;
export const LAYOUT_2X2_GRID = '2x2-grid' as const;

export const DESIGN_POSITION_TOP = 'top' as const;
export const DESIGN_POSITION_BOTTOM = 'bottom' as const;
export const DESIGN_POSITION_LEFT = 'left' as const;
export const DESIGN_POSITION_RIGHT = 'right' as const;

export const OVERLAY_MODE_FREE = 'free' as const;
export const OVERLAY_MODE_FOOTER = 'footer' as const;

// Type definitions
export type LayoutType =
  | typeof LAYOUT_3X1_VERTICAL
  | typeof LAYOUT_4X1_VERTICAL
  | typeof LAYOUT_6X1_VERTICAL
  | typeof LAYOUT_2X2_GRID;

export type DesignPositionType =
  | typeof DESIGN_POSITION_TOP
  | typeof DESIGN_POSITION_BOTTOM
  | typeof DESIGN_POSITION_LEFT
  | typeof DESIGN_POSITION_RIGHT;

export type OverlayModeType =
  | typeof OVERLAY_MODE_FREE
  | typeof OVERLAY_MODE_FOOTER;

export type PhotoAspectRatioType = 'auto' | '1:1' | '3:4';

/**
 * Template model - matches backend exactly
 */
export interface Template {
  id: string;
  name: string;
  layout: LayoutType;
  design_file_path: string | null;
  design_position: DesignPositionType;
  overlay_mode: OverlayModeType;
  // Optional free overlay controls (normalized / scale)
  // When all are null/undefined, backend usa el modo legacy de banda fija.
  design_scale?: number | null;
  design_offset_x?: number | null;
  design_offset_y?: number | null;
  design_stretch?: boolean;
  background_color: string;
  photo_spacing: number;
  photo_filter?: 'none' | 'bw' | 'sepia' | 'glam';
  photo_aspect_ratio?: PhotoAspectRatioType;
  is_active: boolean;
  created_at: string;
  preview_url: string | null;
}

/**
 * Request model for creating a template
 */
export interface TemplateCreate {
  name: string;
  layout: LayoutType;
  design_position: DesignPositionType;
  overlay_mode: OverlayModeType;
  background_color: string;
  photo_spacing: number;
  photo_filter?: 'none' | 'bw' | 'sepia' | 'glam';
  design_scale?: number | null;
  design_offset_x?: number | null;
  design_offset_y?: number | null;
  design_stretch?: boolean;
  photo_aspect_ratio?: PhotoAspectRatioType;
}

/**
 * Request model for updating a template
 */
export interface TemplateUpdate {
  name?: string;
  layout?: LayoutType;
  design_file_path?: string;
  design_position?: DesignPositionType;
  overlay_mode?: OverlayModeType;
  background_color?: string;
  photo_spacing?: number;
  photo_filter?: 'none' | 'bw' | 'sepia' | 'glam';
  design_scale?: number | null;
  design_offset_x?: number | null;
  design_offset_y?: number | null;
  design_stretch?: boolean;
  photo_aspect_ratio?: PhotoAspectRatioType;
}

export interface FormData {
  name: string;
  layout: LayoutType;
  design_file: File | null;
  design_position: DesignPositionType;
  overlay_mode: OverlayModeType;
  background_color: string;
  photo_spacing: number;
  photo_filter: 'none' | 'bw' | 'sepia' | 'glam';
  design_scale: number;
  design_offset_x: number;
  design_offset_y: number;
  design_stretch: boolean;
  photo_aspect_ratio: PhotoAspectRatioType;
}

/**
 * Response model for templates list
 */
export interface TemplatesListResponse {
  templates: Template[];
  active_template: Template | null;
}

/**
 * Response model for design upload
 */
export interface UploadDesignResponse {
  success: boolean;
  file_path: string;
  message: string;
}

/**
 * Human-readable labels for layouts
 */
export const LAYOUT_LABELS: Record<LayoutType, string> = {
  [LAYOUT_3X1_VERTICAL]: '3 fotos verticales',
  [LAYOUT_4X1_VERTICAL]: '4 fotos verticales',
  [LAYOUT_6X1_VERTICAL]: '6 fotos verticales',
  [LAYOUT_2X2_GRID]: 'Grid 2x2',
};

/**
 * Human-readable labels for design positions
 */
export const DESIGN_POSITION_LABELS: Record<DesignPositionType, string> = {
  [DESIGN_POSITION_TOP]: 'Arriba',
  [DESIGN_POSITION_BOTTOM]: 'Abajo',
  [DESIGN_POSITION_LEFT]: 'Izquierda',
  [DESIGN_POSITION_RIGHT]: 'Derecha',
};

/**
 * Helper: Get photo count for a layout
 * Single source of truth for layout -> count mapping
 */
export function getLayoutPhotoCount(layout: LayoutType): number {
  const countMap: Record<LayoutType, number> = {
    [LAYOUT_3X1_VERTICAL]: 3,
    [LAYOUT_4X1_VERTICAL]: 4,
    [LAYOUT_6X1_VERTICAL]: 6,
    [LAYOUT_2X2_GRID]: 4,
  };
  return countMap[layout];
}

/**
 * Helper: Get layout dimensions in pixels
 */
export function getLayoutDimensions(layout: LayoutType): { width: number; height: number } {
  const stripWidth = 600;

  const dimensionMap: Record<LayoutType, { width: number; height: number }> = {
    [LAYOUT_3X1_VERTICAL]: { width: stripWidth, height: 1800 },
    [LAYOUT_4X1_VERTICAL]: { width: stripWidth, height: 2400 },
    [LAYOUT_6X1_VERTICAL]: { width: stripWidth, height: 3000 },
    [LAYOUT_2X2_GRID]: { width: stripWidth, height: 1800 },
  };

  return dimensionMap[layout];
}
