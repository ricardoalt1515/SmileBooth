/**
 * Application Constants
 * Centralized configuration values
 */

/**
 * Backend API base URL
 * Can be overridden via VITE_API_URL environment variable
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/**
 * Default application settings
 * Used as fallback if backend is unavailable
 */
export const DEFAULT_SETTINGS = {
  photosToTake: 3,
  countdownSeconds: 5,
  audioEnabled: true,
  voiceRate: 1.0,
  voicePitch: 1.0,
  voiceVolume: 1.0,
} as const;

/**
 * UI Constants
 */
export const UI_CONSTANTS = {
  AUTO_RESET_TIMEOUT: 30000, // 30 seconds
  PHOTO_REVIEW_DURATION: 2500, // 2.5 seconds per photo
  PAUSE_BETWEEN_PHOTOS: 2000, // 2 seconds
  FILE_READY_RETRY_DELAY: 500, // 500ms retry for image loading
  FILE_READY_MAX_RETRIES: 5, // Maximum retries for image loading
} as const;

/**
 * Hotkeys
 */
export const HOTKEYS = {
  OPEN_SETTINGS: 'CommandOrControl+Shift+S',
  START_CAPTURE: ' ', // Space
  RESET: 'Escape',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
} as const;
