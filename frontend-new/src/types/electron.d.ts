/**
 * Electron API type definitions
 * Augments the Window interface with electronAPI
 */

export interface ElectronAPI {
  onOpenSettings: (callback: () => void) => void;
  removeOpenSettingsListener: (callback: () => void) => void;
  setKioskMode: (enable: boolean) => Promise<boolean>;
  exitKiosk: () => Promise<boolean>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
