import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

// Export for use in components
export { API_BASE_URL };

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging (optional)
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
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
    }) => {
      const response = await apiClient.post('/api/image/compose-strip', {
        photo_paths: params.photo_paths,
        design_path: params.design_path || null,
        session_id: params.session_id,
        layout: params.layout,
        design_position: params.design_position,
        background_color: params.background_color,
        photo_spacing: params.photo_spacing,
      });
      return response.data; // { success, strip_path, full_page_path }
    },
    previewStrip: async (params: {
      photo_paths: string[];
      design_path?: string | null;
      // Template metadata (optional)
      layout?: string | null;
      design_position?: string | null;
      background_color?: string | null;
      photo_spacing?: number | null;
    }) => {
      const response = await apiClient.post('/api/image/preview-strip', {
        photo_paths: params.photo_paths,
        design_path: params.design_path || null,
        layout: params.layout,
        design_position: params.design_position,
        background_color: params.background_color,
        photo_spacing: params.photo_spacing,
      }, {
        responseType: 'blob', // Recibir imagen como blob
      });
      // Crear URL del blob para mostrar en <img>
      const imageBlob = response.data;
      const imageUrl = URL.createObjectURL(imageBlob);
      return imageUrl;
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
      audio_enabled?: boolean;
      voice_rate?: number;
      voice_pitch?: number;
      voice_volume?: number;
      strip_layout?: 'vertical-3' | 'vertical-4' | 'vertical-6' | 'grid-2x2';
      print_mode?: 'single' | 'dual-strip';
      photo_spacing?: number;
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
    }) => {
      const response = await apiClient.put(`/api/templates/${templateId}`, updates);
      return response.data; // Template object
    },
    activate: async (templateId: string) => {
      const response = await apiClient.post(`/api/templates/${templateId}/activate`);
      return response.data; // { success, message, template }
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
