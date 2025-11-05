/**
 * Tipos TypeScript de la aplicación
 */

export type AppScreen = 
  | 'start'
  | 'countdown'
  | 'capture'
  | 'processing'
  | 'success';

export interface CaptureSession {
  id: string;
  photos: string[];
  stripPath?: string;
  fullPagePath?: string;
  timestamp: Date;
}

export interface AppSettings {
  cameraId: number;
  designPath: string | null;
  autoPrint: boolean;
  printCopies: number;
}
