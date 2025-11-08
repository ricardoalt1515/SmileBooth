// Screen types
export type Screen = 'start' | 'countdown' | 'capture' | 'processing' | 'success';

// Camera types
export interface Camera {
  id: string;
  name: string;
  isAvailable: boolean;
}

// Image types
export interface CapturedImage {
  id: string;
  url: string;
  timestamp: Date;
}

// Session types
export interface PhotoSession {
  id: string;
  images: CapturedImage[];
  stripId?: string;
  createdAt: Date;
}

// Design types
export interface Design {
  id: string;
  name: string;
  thumbnailUrl: string;
  templateUrl: string;
}

// API Response types
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
