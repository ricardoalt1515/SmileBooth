import { create } from 'zustand';
import type { CapturedImage } from '../types';

type Screen = 'start' | 'countdown' | 'capture' | 'processing' | 'success' | 'settings' | 'gallery';

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
  autoResetSeconds: number;
  loadSettings: (settings: {
    photos_to_take?: number;
    countdown_seconds?: number;
    audio_enabled?: boolean;
    voice_rate?: number;
    voice_pitch?: number;
    voice_volume?: number;
    auto_reset_seconds?: number;
  }) => void;
  setSettings: (settings: Partial<Pick<AppState, 'countdownSeconds' | 'photosToTake' | 'audioEnabled' | 'voiceRate' | 'voicePitch' | 'voiceVolume' | 'autoResetSeconds'>>) => void;

  // Backend connection
  isBackendConnected: boolean;
  setBackendConnected: (connected: boolean) => void;

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
  autoResetSeconds: 30,
  isBackendConnected: false,
};

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
  }),

  setSettings: (settings) => set(settings),

  setBackendConnected: (connected) => set({ isBackendConnected: connected }),

  reset: () => set({
    ...initialState,
    // Mantener conexión del backend y photoPaths
    isBackendConnected: true,
    photoPaths: initialState.photoPaths,
  }),
}));
