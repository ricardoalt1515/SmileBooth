/**
 * API Client - Comunicación con backend Python
 * Optimizado con timeouts y manejo de errores
 */
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

// Cliente axios optimizado
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 segundos timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tipos de respuesta
interface CaptureResponse {
  success: boolean;
  session_id: string;
  file_path: string;
  message: string;
}

interface ComposeStripResponse {
  success: boolean;
  strip_path: string;
  full_page_path: string | null;
  message: string;
}

// API Methods
export const photoBoothAPI = {
  /**
   * Capturar foto de la cámara
   */
  capturePhoto: async (cameraId: number = 0, sessionId?: string): Promise<CaptureResponse> => {
    const response = await api.post('/api/camera/capture', {
      camera_id: cameraId,
      session_id: sessionId,
    });
    return response.data;
  },

  /**
   * Componer tira de 3 fotos con diseño
   */
  composeStrip: async (
    photoPaths: string[],
    designPath: string | null,
    sessionId: string
  ): Promise<ComposeStripResponse> => {
    const response = await api.post('/api/image/compose-strip', {
      photo_paths: photoPaths,
      design_path: designPath,
      session_id: sessionId,
    });
    return response.data;
  },

  /**
   * Health check del backend
   */
  healthCheck: async (): Promise<boolean> => {
    try {
      const response = await api.get('/health');
      return response.data.status === 'healthy';
    } catch {
      return false;
    }
  },

  /**
   * Listar cámaras disponibles
   */
  listCameras: async (): Promise<number[]> => {
    const response = await api.get('/api/camera/list');
    return response.data.available_cameras;
  },

  /**
   * Imprimir imagen
   */
  printImage: async (
    filePath: string,
    printerName: string | null = null,
    copies: number = 2
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/api/print/queue', {
      file_path: filePath,
      printer_name: printerName,
      copies: copies,
    });
    return response.data;
  },

  /**
   * Obtener diseño activo
   */
  getActiveDesign: async (): Promise<{ active_design: { id: string; file_path: string } | null }> => {
    const response = await api.get('/api/designs/active');
    return response.data;
  },
};

export default photoBoothAPI;
