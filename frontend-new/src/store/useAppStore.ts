import { create } from 'zustand';

type Screen = 'start' | 'countdown' | 'capture' | 'processing' | 'success';

interface AppState {
  // Current screen
  currentScreen: Screen;
  setCurrentScreen: (screen: Screen) => void;

  // Session data
  sessionId: string | null;
  setSessionId: (id: string | null) => void;

  // Settings
  countdownSeconds: number;
  photosToTake: number;
  setSettings: (settings: Partial<Pick<AppState, 'countdownSeconds' | 'photosToTake'>>) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  currentScreen: 'start' as Screen,
  sessionId: null,
  countdownSeconds: 3,
  photosToTake: 3,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setCurrentScreen: (screen) => set({ currentScreen: screen }),

  setSessionId: (id) => set({ sessionId: id }),

  setSettings: (settings) => set(settings),

  reset: () => set(initialState),
}));
