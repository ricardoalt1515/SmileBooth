/**
 * Electron API type definitions
 * Augments the Window interface with electronAPI
 */

export interface ElectronAPI {
  onOpenSettings: (callback: () => void) => void;
  removeOpenSettingsListener: (callback: () => void) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
