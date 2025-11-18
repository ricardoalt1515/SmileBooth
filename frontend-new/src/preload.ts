// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

// Expose IPC methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  onOpenSettings: (callback: () => void) => {
    ipcRenderer.on('open-settings', callback);
  },
  removeOpenSettingsListener: (callback: () => void) => {
    ipcRenderer.removeListener('open-settings', callback);
  },
  setKioskMode: (enable: boolean) => ipcRenderer.invoke('set-kiosk-mode', enable),
  exitKiosk: () => ipcRenderer.invoke('exit-kiosk'),
});
