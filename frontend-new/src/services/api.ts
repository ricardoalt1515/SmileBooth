import axios from 'axios';
import { API_BASE_URL } from '../config/constants';
import { useAppStore } from '../store/useAppStore';

// Export for use in components
export { API_BASE_URL };

// Shared DTOs for backend contracts used in multiple places
export interface BackendSettings {
  photos_to_take?: number;
  countdown_seconds?: number;
  audio_enabled?: boolean;
  voice_rate?: number;
  voice_pitch?: number;
  voice_volume?: number;
  auto_reset_seconds?: number;
  mirror_preview?: boolean;
  kiosk_mode?: boolean;
  auto_print?: boolean;
  print_copies?: number;
  camera_width?: number;
  camera_height?: number;
  print_mode?: 'single' | 'dual-strip';
  paper_size?: '2x6' | '4x6' | '5x7';
  strip_layout?: 'vertical-3' | 'vertical-4' | 'vertical-6' | 'grid-2x2';
  photo_spacing?: number;
  photo_filter?: string | null;
}

export interface ConfigResponse {
  settings: BackendSettings;
  presets: any[];
  active_preset: any | null;
  templates: any[];
  active_template: any | null;
}

interface HealthJobSummary {
  job_id: string;
  status: string;
  error?: string | null;
}

export interface FullHealthResponse {
  backend: {
    status: string;
    message?: string;
    version?: string;
  };
  camera?: {
    status: string;
    available_cameras?: number[];
    message?: string;
  };
  printer?: {
    status: string;
    printers?: string[];
    default_printer?: string | null;
    message?: string;
  };
  print_queue?: {
    total_jobs: number;
    failed_jobs: number;
    last_job: HealthJobSummary | null;
    last_failed: HealthJobSummary | null;
    error?: string;
  };
}

// Create axios instance with default config
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout (reduced from 30s for better UX)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Special client for long-running image operations
const imageProcessingClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds for image processing only
  headers: {
    'Content-Type': 'application/json',
  },
});

const logEvent = (level: 'info' | 'warning' | 'error', source: string, message: string) => {
  // Avoid circular imports in runtime by using getState directly
  const { addLog } = useAppStore.getState();
  if (addLog) {
    addLog({ level, source, message });
  }
};

// Request interceptor for logging (optional)
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    logEvent('error', 'api', `Error de request: ${error.message ?? 'desconocido'}`);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API] Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error('[API] Response error:', error.response?.status, error.message);
    const endpoint = error.config?.url ?? 'desconocido';
    logEvent('error', 'api', `Error ${error.response?.status ?? 'sin código'} en ${endpoint}`);
    return Promise.reject(error);
  }
);

// API methods for photobooth backend
export const photoboothAPI = {
  // Health check
  healthCheck: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },
  fullHealth: async (options?: { includeCamera?: boolean }) => {
    const response = await apiClient.get<FullHealthResponse>('/api/health/full', {
      params: options?.includeCamera ? { include_camera: true } : undefined,
    });
    return response.data;
  },

  config: {
    get: async () => {
      const response = await apiClient.get<ConfigResponse>('/api/config');
      return response.data;
    },
  },

  // Camera endpoints
  camera: {
    list: async () => {
      const response = await apiClient.get('/api/camera/list');
      return response.data;
    },
    capture: async (params: { camera_id?: number; session_id?: string } = {}) => {
      const response = await apiClient.post('/api/camera/capture', {
        camera_id: params.camera_id ?? 0,
        session_id: params.session_id ?? null,
      });
      return response.data; // { success, session_id, file_path }
    },
    upload: async (params: { file: Blob | File; session_id?: string }) => {
      const formData = new FormData();
      formData.append('file', params.file);
      if (params.session_id) {
        formData.append('session_id', params.session_id);
      }

      const response = await apiClient.post('/api/camera/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data; // { success, session_id, file_path }
    },
    test: async (cameraId: number) => {
      const response = await apiClient.get(`/api/camera/test/${cameraId}`);
      return response.data;
    },
  },

  // Image endpoints
  image: {
    composeStrip: async (params: {
      photo_paths: string[];
      design_path?: string | null;
      session_id?: string;
      // Template metadata (optional)
      layout?: string | null;
      design_position?: string | null;
      background_color?: string | null;
      photo_spacing?: number | null;
      photo_filter?: string | null;
      print_mode?: string | null;
      // Optional free overlay controls (normalized / scale)
      design_scale?: number | null;
      design_offset_x?: number | null;
      design_offset_y?: number | null;
    }) => {
      // Use imageProcessingClient for longer timeout
      const response = await imageProcessingClient.post('/api/image/compose-strip', {
        photo_paths: params.photo_paths,
        design_path: params.design_path || null,
        session_id: params.session_id,
        layout: params.layout,
        design_position: params.design_position,
        background_color: params.background_color,
        photo_spacing: params.photo_spacing,
        photo_filter: params.photo_filter,
        print_mode: params.print_mode,
        design_scale: params.design_scale,
        design_offset_x: params.design_offset_x,
        design_offset_y: params.design_offset_y,
      });
      return response.data; // { success, strip_path, full_page_path }
    },
    composeStripJob: async (params: {
      photo_paths: string[];
      design_path?: string | null;
      session_id?: string;
      layout?: string | null;
      design_position?: string | null;
      background_color?: string | null;
      photo_spacing?: number | null;
      photo_filter?: string | null;
      print_mode?: string | null;
      design_scale?: number | null;
      design_offset_x?: number | null;
      design_offset_y?: number | null;
    }) => {
      const response = await apiClient.post('/api/image/jobs/compose', {
        photo_paths: params.photo_paths,
        design_path: params.design_path || null,
        session_id: params.session_id,
        layout: params.layout,
        design_position: params.design_position,
        background_color: params.background_color,
        photo_spacing: params.photo_spacing,
        photo_filter: params.photo_filter,
        print_mode: params.print_mode,
        design_scale: params.design_scale,
        design_offset_x: params.design_offset_x,
        design_offset_y: params.design_offset_y,
      });
      return response.data as {
        job_id: string;
        status: JobStatus;
        result?: {
          success: boolean;
          strip_path: string;
          full_page_path?: string | null;
          message?: string;
        } | null;
        error?: string | null;
      };
    },
    getComposeJobStatus: async (jobId: string) => {
      const response = await apiClient.get(`/api/image/jobs/${encodeURIComponent(jobId)}`);
      return response.data as {
        job_id: string;
        status: JobStatus;
        result?: {
          success: boolean;
          strip_path: string;
          full_page_path?: string | null;
          message?: string;
        } | null;
        error?: string | null;
      };
    },
    previewStrip: async (params: {
      photo_paths: string[];
      design_path?: string | null;
      design_file?: File | null;
      // Template metadata (optional)
      layout?: string | null;
      design_position?: string | null;
      background_color?: string | null;
      photo_spacing?: number | null;
      photo_filter?: string | null;
      design_scale?: number | null;
      design_offset_x?: number | null;
      design_offset_y?: number | null;
    }) => {
      // Siempre usamos multipart/form-data para alinearnos con la firma de FastAPI,
      // que combina Body opcional + campos Form/File.
      const form = new FormData();

      // Lista de fotos como JSON serializado
      form.append('photo_paths_json', JSON.stringify(params.photo_paths));

      // Diseño temporal opcional
      if (params.design_file) {
        form.append('design_file', params.design_file);
      }

      // design_path se espera como design_path_form en el backend
      if (params.design_path) {
        form.append('design_path_form', params.design_path);
      }

      if (params.layout) {
        form.append('layout', params.layout);
      }
      if (params.design_position) {
        form.append('design_position', params.design_position);
      }
      if (params.background_color) {
        form.append('background_color', params.background_color);
      }
      if (params.photo_spacing !== undefined && params.photo_spacing !== null) {
        form.append('photo_spacing', String(params.photo_spacing));
      }
      if (params.photo_filter) {
        form.append('photo_filter', params.photo_filter);
      }
      if (params.design_scale !== undefined && params.design_scale !== null) {
        form.append('design_scale', String(params.design_scale));
      }
      if (params.design_offset_x !== undefined && params.design_offset_x !== null) {
        form.append('design_offset_x', String(params.design_offset_x));
      }
      if (params.design_offset_y !== undefined && params.design_offset_y !== null) {
        form.append('design_offset_y', String(params.design_offset_y));
      }

      const response = await imageProcessingClient.post('/api/image/preview-strip', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const previewPath: string | undefined = (response.data as any)?.preview_path;
      if (!previewPath) {
        throw new Error('Respuesta inválida de preview-strip');
      }
      if (previewPath.startsWith('http')) {
        return previewPath;
      }
      return `${API_BASE_URL}${previewPath}`;
    },
    uploadDesignPreview: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const response = await imageProcessingClient.post('/api/image/design-preview-upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const designPath: string | undefined = (response.data as any)?.design_path;
      if (!designPath) {
        throw new Error('Respuesta inválida al subir diseño');
      }
      // Devolvemos la ruta servible tal cual (/data/...) para usarla en previewStrip
      return designPath;
    },
  },

  // Print endpoints
  print: {
    queue: async (params: {
      file_path: string;
      printer_name?: string | null;
      copies?: number;
    }) => {
      const response = await apiClient.post('/api/print/queue', {
        file_path: params.file_path,
        printer_name: params.printer_name || null,
        copies: params.copies ?? 2,
      });
      return response.data; // { success, message, printer_used }
    },
    listPrinters: async () => {
      const response = await apiClient.get('/api/print/printers');
      return response.data; // { printers, default_printer }
    },
    test: async (printerName?: string | null) => {
      const response = await apiClient.post('/api/print/test', null, {
        params: { printer_name: printerName || null },
      });
      return response.data;
    },
    listJobs: async () => {
      const response = await apiClient.get('/api/print/jobs');
      return response.data as Array<{
        job_id: string;
        file_path: string;
        printer_name: string | null;
        copies: number;
        status: string;
        error?: string | null;
        created_at: string;
        updated_at: string;
      }>;
    },
    retryJob: async (jobId: string) => {
      const response = await apiClient.post(`/api/print/jobs/${encodeURIComponent(jobId)}/retry`);
      return response.data as { success: boolean; message: string; printer_used?: string | null };
    },
  },

  // Settings endpoints
  settings: {
    get: async () => {
      const response = await apiClient.get('/api/settings');
      return response.data; // Settings object
    },
    update: async (updates: {
      photos_to_take?: number;
      countdown_seconds?: number;
      backend_url?: string;
      default_printer?: string | null;
      active_design_id?: string | null;
      active_template_id?: string | null;
      audio_enabled?: boolean;
      voice_rate?: number;
      voice_pitch?: number;
      voice_volume?: number;
      auto_print?: boolean;
      print_copies?: number;
      camera_width?: number;
      camera_height?: number;
      mirror_preview?: boolean;
      kiosk_mode?: boolean;
      print_mode?: 'single' | 'dual-strip';
      paper_size?: '2x6' | '4x6' | '5x7';
      strip_layout?: 'vertical-3' | 'vertical-4' | 'vertical-6' | 'grid-2x2';
      photo_spacing?: number;
      photo_filter?: string | null;
    }) => {
      const response = await apiClient.patch('/api/settings', updates);
      return response.data; // Updated Settings object
    },
    reset: async () => {
      const response = await apiClient.post('/api/settings/reset');
      return response.data; // Default Settings object
    },
  },

  // Gallery endpoints
  gallery: {
    list: async () => {
      const response = await apiClient.get('/api/gallery/list');
      return response.data as {
        session_id: string;
        photos: Array<{
          id: string;
          filename: string;
          path: string;
          url: string;
          thumbnail_url?: string | null;
          session_id: string;
          timestamp: string;
          size_bytes: number;
        }>;
        strip_url?: string | null;
        full_strip_url?: string | null;
        total_size_bytes: number;
        created_at?: string | null;
      }[];
    },
    getPhotos: async () => {
      const response = await apiClient.get('/api/gallery/photos');
      return response.data; // { photos, stats }
    },
    getStats: async () => {
      const response = await apiClient.get('/api/gallery/stats');
      return response.data; // { total_sessions, total_photos, latest_session, total_size_mb }
    },
    exportZip: async () => {
      const response = await apiClient.post('/api/gallery/export-zip', {}, {
        responseType: 'blob',
      });
      // Crear URL del blob para descargar
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `photobooth_event_${Date.now()}.zip`;
      link.click();
      window.URL.revokeObjectURL(url);
    },
    exportSessionZip: async (sessionId: string) => {
      const response = await apiClient.post(`/api/gallery/sessions/${encodeURIComponent(sessionId)}/zip`, {}, {
        responseType: 'blob',
      });
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `session_${sessionId}.zip`;
      link.click();
      window.URL.revokeObjectURL(url);
    },
    clearAll: async () => {
      const response = await apiClient.delete('/api/gallery/clear-all');
      return response.data; // { success, message, deleted_count }
    },
    deletePhoto: async (sessionId: string, filename: string) => {
      const response = await apiClient.delete(`/api/gallery/sessions/${encodeURIComponent(sessionId)}/photos/${encodeURIComponent(filename)}`);
      return response.data as { success: boolean; message: string };
    },
  },

  // Sessions endpoints
  sessions: {
    list: async (params: {
      preset_id?: string;
      status?: string;
      limit?: number;
    } = {}) => {
      const response = await apiClient.get('/api/sessions', {
        params,
      });
      return response.data; // { sessions, total }
    },

    get: async (sessionId: string) => {
      const response = await apiClient.get(`/api/sessions/${sessionId}`);
      return response.data; // SessionRecord
    },

    reprint: async (sessionId: string, payload: {
      printer_name?: string | null;
      copies?: number;
      file_path?: string | null;
    } = {}) => {
      const response = await apiClient.post(`/api/sessions/${sessionId}/reprint`, {
        printer_name: payload.printer_name ?? null,
        copies: payload.copies ?? 2,
        file_path: payload.file_path ?? null,
      });
      return response.data; // Updated SessionRecord
    },

    export: async (payload: {
      preset_id?: string | null;
      session_ids?: string[] | null;
    } = {}) => {
      const response = await apiClient.post('/api/sessions/export', {
        preset_id: payload.preset_id ?? null,
        session_ids: payload.session_ids ?? null,
      });
      return response.data as {
        success: boolean;
        file: string;
        url: string;
        filename: string;
      };
    },
  },

  // Presets/Events endpoints
  presets: {
    list: async () => {
      const response = await apiClient.get('/api/presets');
      return response.data; // { presets, active_preset, default_preset }
    },
    get: async (presetId: string) => {
      const response = await apiClient.get(`/api/presets/${presetId}`);
      return response.data; // EventPreset
    },
    create: async (presetData: {
      name: string;
      event_type?: string;
      event_date?: string;
      photos_to_take?: number;
      countdown_seconds?: number;
      auto_reset_seconds?: number;
      audio_enabled?: boolean;
      voice_rate?: number;
      voice_pitch?: number;
      voice_volume?: number;
      template_id?: string;
      design_id?: string;
      photo_filter?: string;
      notes?: string;
      client_name?: string;
      client_contact?: string;
    }) => {
      const response = await apiClient.post('/api/presets', presetData);
      return response.data; // EventPreset
    },
    update: async (presetId: string, updates: {
      name?: string;
      event_type?: string;
      event_date?: string;
      photos_to_take?: number;
      countdown_seconds?: number;
      auto_reset_seconds?: number;
      audio_enabled?: boolean;
      voice_rate?: number;
      voice_pitch?: number;
      voice_volume?: number;
      template_id?: string;
      design_id?: string;
      photo_filter?: string;
      notes?: string;
      client_name?: string;
      client_contact?: string;
    }) => {
      const response = await apiClient.put(`/api/presets/${presetId}`, updates);
      return response.data; // EventPreset
    },
    activate: async (presetId: string) => {
      const response = await apiClient.post(`/api/presets/${presetId}/activate`);
      return response.data; // { success, preset, message }
    },
    delete: async (presetId: string) => {
      const response = await apiClient.delete(`/api/presets/${presetId}`);
      return response.data; // { success, message }
    },
    duplicate: async (presetId: string, newName?: string) => {
      const params = newName ? `?new_name=${encodeURIComponent(newName)}` : '';
      const response = await apiClient.post(`/api/presets/${presetId}/duplicate${params}`);
      return response.data; // EventPreset
    },
  },

  // Templates API
  templates: {
    create: async (templateData: {
      name: string;
      layout: string;
      design_position: string;
      background_color: string;
      photo_spacing: number;
      photo_filter?: string;
      design_scale?: number | null;
      design_offset_x?: number | null;
      design_offset_y?: number | null;
    }) => {
      const response = await apiClient.post('/api/templates/create', templateData);
      return response.data; // Template object
    },
    list: async () => {
      const response = await apiClient.get('/api/templates/list');
      return response.data; // { templates: Template[], active_template: Template | null }
    },
    getActive: async () => {
      const response = await apiClient.get('/api/templates/list');
      return response.data.active_template || null;
    },
    get: async (templateId: string) => {
      const response = await apiClient.get(`/api/templates/${templateId}`);
      return response.data; // Template object
    },
    update: async (templateId: string, updates: {
      name?: string;
      layout?: string;
      design_position?: string;
      background_color?: string;
      photo_spacing?: number;
      photo_filter?: string;
      design_scale?: number | null;
      design_offset_x?: number | null;
      design_offset_y?: number | null;
    }) => {
      const response = await apiClient.put(`/api/templates/${templateId}`, updates);
      return response.data; // Template object
    },
    activate: async (templateId: string) => {
      const response = await apiClient.post(`/api/templates/${templateId}/activate`);
      return response.data; // { success, message, template }
    },
    duplicate: async (templateId: string, newName?: string) => {
      const response = await apiClient.post(`/api/templates/${templateId}/duplicate`, {
        new_name: newName || undefined,
      });
      return response.data; // Template object
    },
    uploadDesign: async (templateId: string, file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post(
        `/api/templates/${templateId}/upload-design`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data; // { success, file_path, message }
    },
    delete: async (templateId: string) => {
      const response = await apiClient.delete(`/api/templates/${templateId}`);
      return response.data; // { success, message }
    },
    getPreview: (templateId: string) => {
      return `${API_BASE_URL}/api/templates/${templateId}/preview`;
    },
  },
};

export default photoboothAPI;
