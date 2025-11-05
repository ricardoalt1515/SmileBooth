/**
 * Electron Preload Script - Puente seguro entre Main y Renderer
 * Solo expone APIs necesarias
 */
import { contextBridge } from 'electron';

// Exponer APIs limitadas al renderer
contextBridge.exposeInMainWorld('electron', {
  // Info del sistema
  platform: process.platform,
  
  // APIs que agregaremos después
  // - IPC communication
  // - File system access (limitado)
});

// Log para debugging
console.log('✅ Preload script cargado');
