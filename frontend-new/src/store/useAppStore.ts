import { create } from 'zustand';
import type { CapturedImage } from '../types';

type Screen = 'start' | 'countdown' | 'capture' | 'processing' | 'success' | 'settings' | 'gallery';
type LogLevel = 'info' | 'warning' | 'error';

export interface AppLog {
  id: string;
  level: LogLevel;
  message: string;
  source?: string;
  timestamp: number;
}

export interface PrintJob {
  job_id: string;
  file_path: string;
  printer_name: string | null;
  copies: number;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  error?: string | null;
  created_at: string;
  updated_at: string;
}
interface AppState {
  // Current screen
  currentScreen: Screen;
  setCurrentScreen: (screen: Screen) => void;

  // Session data
  sessionId: string | null;
  setSessionId: (id: string | null) => void;

  // Captured images
  capturedImages: CapturedImage[];
  addCapturedImage: (image: CapturedImage) => void;
  clearCapturedImages: () => void;

  // Backend photo paths (para compose-strip)
  photoPaths: string[];
  addPhotoPath: (path: string) => void;
  clearPhotoPaths: () => void;

  // Current photo count during capture
  currentPhotoIndex: number;
  incrementPhotoIndex: () => void;
  resetPhotoIndex: () => void;

  // Strip data
  stripId: string | null;
  stripImageUrl: string | null;
  setStripData: (stripId: string, stripImageUrl: string) => void;

  // Loading and error states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;

  // Settings
  countdownSeconds: number;
  photosToTake: number;
  audioEnabled: boolean;
  voiceRate: number;
  voicePitch: number;
  voiceVolume: number;
  selectedVoiceURI: string | null;
  autoResetSeconds: number;
  photoFilter: string;
  sessionPhotoFilter: string | null;
  mirrorPreview: boolean;
  kioskMode: boolean;
  autoPrint: boolean;
  printCopies: number;
  cameraWidth: number;
  cameraHeight: number;
  printMode: 'single' | 'dual-strip';
  paperSize: '2x6' | '4x6' | '5x7';
  defaultPrinter: string | null;
  defaultPrinter: string | null;
  loadSettings: (settings: {
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
    default_printer?: string | null;
  }) => void;
  setSettings: (settings: Partial<Pick<AppState,
    'countdownSeconds' |
    'photosToTake' |
    'audioEnabled' |
    'voiceRate' |
    'voicePitch' |
    'voiceVolume' |
    'autoResetSeconds' |
    'mirrorPreview' |
    'kioskMode' |
    'autoPrint' |
    'printCopies' |
    'cameraWidth' |
    'cameraHeight' |
    'printMode' |
    'paperSize' |
    'defaultPrinter' |
    'selectedVoiceURI' |
    'photoFilter'
  >>) => void;
  setSessionPhotoFilter: (filter: string | null) => void;

  // Backend connection
  isBackendConnected: boolean;
  setBackendConnected: (connected: boolean) => void;

  // Operational logs for staff
  logs: AppLog[];
  addLog: (entry: Omit<AppLog, 'id' | 'timestamp'> & { timestamp?: number }) => void;
  clearLogs: () => void;

  // Reset
  reset: () => void;
}

const initialState = {
  currentScreen: 'capture' as Screen, // ✨ Ir directo a cámara
  sessionId: null,
  capturedImages: [],
  photoPaths: [],
  currentPhotoIndex: 0,
  stripId: null,
  stripImageUrl: null,
  isLoading: false,
  error: null,
  countdownSeconds: 5,
  photosToTake: 3,
  audioEnabled: true,
  voiceRate: 1.0,
  voicePitch: 1.0,
  voiceVolume: 1.0,
  selectedVoiceURI: null,
  autoResetSeconds: 30,
  photoFilter: 'none',
  sessionPhotoFilter: null,
  mirrorPreview: false,
  kioskMode: true,
  autoPrint: false,
  printCopies: 2,
  cameraWidth: 1280,
  cameraHeight: 720,
  printMode: 'dual-strip' as const,
  paperSize: '4x6' as const,
  defaultPrinter: null,
  isBackendConnected: false,
  logs: [] as AppLog[],
};

const MAX_LOGS = 50;

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setCurrentScreen: (screen) => set({ currentScreen: screen }),

  setSessionId: (id) => set({ sessionId: id }),

  addCapturedImage: (image) =>
    set((state) => ({
      capturedImages: [...state.capturedImages, image],
    })),

  clearCapturedImages: () => set({ capturedImages: [] }),

  addPhotoPath: (path) =>
    set((state) => ({
      photoPaths: [...state.photoPaths, path],
    })),

  clearPhotoPaths: () => set({ photoPaths: [] }),

  incrementPhotoIndex: () =>
    set((state) => ({
      currentPhotoIndex: state.currentPhotoIndex + 1,
    })),

  resetPhotoIndex: () => set({ currentPhotoIndex: 0 }),

  setStripData: (stripId, stripImageUrl) =>
    set({ stripId, stripImageUrl }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  loadSettings: (settings) => set({
    photosToTake: settings.photos_to_take ?? initialState.photosToTake,
    countdownSeconds: settings.countdown_seconds ?? initialState.countdownSeconds,
    audioEnabled: settings.audio_enabled ?? initialState.audioEnabled,
    voiceRate: settings.voice_rate ?? initialState.voiceRate,
    voicePitch: settings.voice_pitch ?? initialState.voicePitch,
    voiceVolume: settings.voice_volume ?? initialState.voiceVolume,
    autoResetSeconds: settings.auto_reset_seconds ?? initialState.autoResetSeconds,
    photoFilter: (settings as any).photo_filter ?? initialState.photoFilter,
    mirrorPreview: settings.mirror_preview ?? initialState.mirrorPreview,
    kioskMode: settings.kiosk_mode ?? initialState.kioskMode,
    autoPrint: settings.auto_print ?? initialState.autoPrint,
    printCopies: settings.print_copies ?? initialState.printCopies,
    cameraWidth: settings.camera_width ?? initialState.cameraWidth,
    cameraHeight: settings.camera_height ?? initialState.cameraHeight,
    printMode: settings.print_mode ?? initialState.printMode,
    paperSize: settings.paper_size ?? initialState.paperSize,
    defaultPrinter: settings.default_printer ?? initialState.defaultPrinter,
  }),

  setSettings: (settings) => set(settings),

  setSessionPhotoFilter: (filter) => set({ sessionPhotoFilter: filter }),

  setBackendConnected: (connected) => set({ isBackendConnected: connected }),

  addLog: (entry) => set((state) => {
    const timestamp = entry.timestamp ?? Date.now();
    const newEntry: AppLog = {
      id: `${timestamp}-${state.logs.length}`,
      timestamp,
      ...entry,
    };

    const boundedLogs = [newEntry, ...state.logs].slice(0, MAX_LOGS);
    return { logs: boundedLogs };
  }),

  clearLogs: () => set({ logs: [] }),

  reset: () => set({
    ...initialState,
    // Mantener conexión del backend y photoPaths
    isBackendConnected: true,
    photoPaths: initialState.photoPaths,
  }),
}));
