/**
 * Zustand Store - OPTIMIZADO para bajo consumo
 * - Estado mínimo necesario
 * - Sin persistencia innecesaria
 * - Actualizaciones atómicas
 */
import { create } from 'zustand';
import type { AppScreen, CaptureSession, AppSettings } from '../types';

interface AppState {
  // UI State
  currentScreen: AppScreen;
  setScreen: (screen: AppScreen) => void;
  
  // Session State
  currentSession: CaptureSession | null;
  startSession: () => void;
  addPhoto: (photoPath: string) => void;
  completeSession: (stripPath: string, fullPagePath: string) => void;
  resetSession: () => void;
  
  // Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  
  // Countdown
  countdown: number;
  setCountdown: (value: number) => void;
  
  // Loading
  isLoading: boolean;
  setLoading: (value: boolean) => void;
}

const defaultSettings: AppSettings = {
  cameraId: 0,
  designPath: null,
  autoPrint: true,
  printCopies: 2,
};

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  currentScreen: 'start',
  currentSession: null,
  settings: defaultSettings,
  countdown: 0,
  isLoading: false,
  
  // Actions
  setScreen: (screen) => set({ currentScreen: screen }),
  
  startSession: () => set({
    currentSession: {
      id: Date.now().toString(),
      photos: [],
      timestamp: new Date(),
    },
    currentScreen: 'countdown',
  }),
  
  addPhoto: (photoPath) => set((state) => ({
    currentSession: state.currentSession
      ? {
          ...state.currentSession,
          photos: [...state.currentSession.photos, photoPath],
        }
      : null,
  })),
  
  completeSession: (stripPath, fullPagePath) => set((state) => ({
    currentSession: state.currentSession
      ? {
          ...state.currentSession,
          stripPath,
          fullPagePath,
        }
      : null,
    currentScreen: 'success',
  })),
  
  resetSession: () => set({
    currentSession: null,
    currentScreen: 'start',
    countdown: 0,
    isLoading: false,
  }),
  
  updateSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings },
  })),
  
  setCountdown: (value) => set({ countdown: value }),
  
  setLoading: (value) => set({ isLoading: value }),
}));
