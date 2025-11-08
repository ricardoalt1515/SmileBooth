import axios from 'axios';

// Backend API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

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
      const response = await apiClient.get('/camera/list');
      return response.data;
    },
    capture: async (cameraId?: string) => {
      const response = await apiClient.post('/camera/capture', { camera_id: cameraId });
      return response.data;
    },
  },

  // Image endpoints
  image: {
    upload: async (imageData: Blob | File) => {
      const formData = new FormData();
      formData.append('image', imageData);
      const response = await apiClient.post('/image/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
  },

  // Print endpoints
  print: {
    createStrip: async (imageIds: string[]) => {
      const response = await apiClient.post('/print/create-strip', { image_ids: imageIds });
      return response.data;
    },
    send: async (stripId: string) => {
      const response = await apiClient.post('/print/send', { strip_id: stripId });
      return response.data;
    },
  },

  // Design endpoints
  design: {
    list: async () => {
      const response = await apiClient.get('/design/list');
      return response.data;
    },
    get: async (designId: string) => {
      const response = await apiClient.get(`/design/${designId}`);
      return response.data;
    },
  },
};

export default photoboothAPI;
