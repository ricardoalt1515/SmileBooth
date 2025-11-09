# 🚀 GUÍA DE DEPLOYMENT PARA PRODUCCIÓN

Esta guía explica cómo empaquetar y distribuir la aplicación Photobooth para que el cliente final la use como una aplicación normal de escritorio.

---

## 🎯 OBJETIVO

Crear **UNA SOLA APLICACIÓN** que:
- ✅ Se instale con un instalador normal (`.exe`, `.dmg`, `.deb`)
- ✅ Se abra con doble click
- ✅ Backend y Frontend funcionen automáticamente
- ✅ Cliente no vea nada técnico (Docker, terminal, comandos)

---

## 📦 ARQUITECTURA DE DISTRIBUCIÓN

```
Photobooth.app (o .exe)
├── Electron Frontend (UI visible)
├── Backend Python (proceso en background)
├── Recursos (imágenes, diseños, etc.)
└── Configuración (se guarda automáticamente)
```

**El usuario solo ve el frontend. El backend es invisible.**

---

## 🛠️ PASO 1: Empaquetar Backend Python

### 1.1 Instalar PyInstaller

```bash
cd backend
pip install pyinstaller
```

### 1.2 Crear spec file para PyInstaller

Crear `backend/photobooth-backend.spec`:

```python
# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['app/main.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('app', 'app'),  # Incluir toda la carpeta app
    ],
    hiddenimports=[
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='photobooth-backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # Sin ventana de consola
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
```

### 1.3 Build del Backend

```bash
cd backend
pyinstaller photobooth-backend.spec

# Output en: backend/dist/photobooth-backend.exe (Windows)
# o: backend/dist/photobooth-backend (macOS/Linux)
```

---

## 🔧 PASO 2: Integrar Backend en Electron

### 2.1 Crear Backend Manager

Crear `frontend-new/src/backend-manager.ts`:

```typescript
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { app } from 'electron';
import axios from 'axios';

class BackendManager {
  private process: ChildProcess | null = null;
  private readonly backendUrl = 'http://127.0.0.1:8000';
  private readonly maxRetries = 30;
  private readonly retryDelay = 1000;

  /**
   * Obtiene la ruta al ejecutable del backend
   */
  private getBackendPath(): string {
    if (app.isPackaged) {
      // En producción: backend está en resources/backend/
      return path.join(process.resourcesPath, 'backend', this.getExecutableName());
    } else {
      // En desarrollo: usar el backend normal
      return path.join(__dirname, '..', '..', 'backend', 'dist', this.getExecutableName());
    }
  }

  private getExecutableName(): string {
    return process.platform === 'win32' ? 'photobooth-backend.exe' : 'photobooth-backend';
  }

  /**
   * Inicia el backend
   */
  async start(): Promise<boolean> {
    try {
      console.log('🚀 Starting backend...');
      const backendPath = this.getBackendPath();
      
      console.log('Backend path:', backendPath);

      // Spawn backend process
      this.process = spawn(backendPath, [], {
        detached: false,
        stdio: 'ignore', // Ignorar output (o usar 'pipe' para debug)
      });

      this.process.on('error', (err) => {
        console.error('❌ Backend process error:', err);
      });

      this.process.on('exit', (code) => {
        console.log(`⚠️  Backend process exited with code ${code}`);
      });

      // Esperar a que el backend esté listo
      const isReady = await this.waitForBackend();
      
      if (isReady) {
        console.log('✅ Backend is ready');
        return true;
      } else {
        console.error('❌ Backend failed to start');
        return false;
      }
    } catch (error) {
      console.error('❌ Error starting backend:', error);
      return false;
    }
  }

  /**
   * Espera a que el backend responda
   */
  private async waitForBackend(): Promise<boolean> {
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        const response = await axios.get(`${this.backendUrl}/health`, {
          timeout: 2000,
        });
        
        if (response.status === 200) {
          return true;
        }
      } catch (error) {
        // Backend aún no está listo, esperar
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
      }
    }
    
    return false;
  }

  /**
   * Detiene el backend
   */
  stop(): void {
    if (this.process) {
      console.log('🛑 Stopping backend...');
      this.process.kill();
      this.process = null;
    }
  }

  /**
   * Verifica si el backend está corriendo
   */
  async isRunning(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.backendUrl}/health`, {
        timeout: 2000,
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

export const backendManager = new BackendManager();
```

### 2.2 Modificar main.ts

Modificar `frontend-new/src/main.ts`:

```typescript
import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { backendManager } from './backend-manager';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const isDevelopment = process.env.NODE_ENV === 'development' || MAIN_WINDOW_VITE_DEV_SERVER_URL;
const isKioskMode = process.env.KIOSK_MODE === 'true';

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      const mainWindow = windows[0];
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

const createWindow = async () => {
  // 🚀 INICIAR BACKEND AUTOMÁTICAMENTE
  console.log('🎬 Starting Photobooth App...');
  
  const backendStarted = await backendManager.start();
  
  if (!backendStarted && !isDevelopment) {
    // En producción, si el backend no inicia, mostrar error
    const { dialog } = require('electron');
    dialog.showErrorBox(
      'Error al iniciar',
      'No se pudo iniciar el backend de la aplicación. Por favor, contacta soporte.'
    );
    app.quit();
    return;
  }

  // Crear ventana principal
  const mainWindow = new BrowserWindow({
    width: isKioskMode ? undefined : 1920,
    height: isKioskMode ? undefined : 1080,
    fullscreen: isKioskMode,
    kiosk: isKioskMode,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
      spellcheck: false,
    },
  });

  // Cargar UI
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDevelopment) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    if (global.gc) {
      global.gc();
    }
  });
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // 🛑 DETENER BACKEND AL CERRAR
  backendManager.stop();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Asegurar que el backend se cierre al salir
app.on('will-quit', () => {
  backendManager.stop();
});
```

---

## 📦 PASO 3: Configurar Electron Forge

### 3.1 Modificar forge.config.js

```javascript
const path = require('path');
const fs = require('fs');

module.exports = {
  packagerConfig: {
    asar: true,
    icon: './assets/icon',
    
    // 🔥 INCLUIR BACKEND EN EL PAQUETE
    extraResource: [
      {
        // Copiar ejecutable del backend a resources/backend/
        from: path.join(__dirname, '../backend/dist'),
        to: 'backend',
        filter: ['photobooth-backend*']
      }
    ],
    
    // Permisos macOS
    osxSign: {},
    osxNotarize: {
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
    },
  },
  
  rebuildConfig: {},
  
  makers: [
    // Windows - Instalador NSIS
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'Photobooth',
        authors: 'Tu Nombre',
        description: 'Aplicación Photobooth profesional',
        setupIcon: './assets/icon.ico',
        loadingGif: './assets/install.gif', // Opcional
      },
    },
    
    // macOS - DMG
    {
      name: '@electron-forge/maker-dmg',
      config: {
        name: 'Photobooth',
        icon: './assets/icon.icns',
        background: './assets/dmg-background.png', // Opcional
      },
    },
    
    // Linux - DEB
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          name: 'photobooth',
          productName: 'Photobooth',
          genericName: 'Photobooth App',
          description: 'Aplicación Photobooth profesional',
          categories: ['Graphics', 'Photography'],
          icon: './assets/icon.png',
        },
      },
    },
    
    // Linux - RPM
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          name: 'photobooth',
          productName: 'Photobooth',
          description: 'Aplicación Photobooth profesional',
          icon: './assets/icon.png',
        },
      },
    },
  ],
  
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    {
      name: '@electron-forge/plugin-vite',
      config: {
        build: [
          {
            entry: 'src/main.ts',
            config: 'vite.main.config.mjs',
          },
          {
            entry: 'src/preload.ts',
            config: 'vite.preload.config.mjs',
          },
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.renderer.config.mjs',
          },
        ],
      },
    },
    {
      name: '@electron-forge/plugin-fuses',
      config: {
        version: '1.8.0',
        resetAdHocDarwinSignature: true,
        runAsNode: false,
        enableCookieEncryption: true,
        enableNodeOptionsEnvironmentVariable: false,
        enableNodeCliInspectArguments: false,
        enableEmbeddedAsarIntegrityValidation: true,
        onlyLoadAppFromAsar: true,
      },
    },
  ],
};
```

---

## 🏗️ PASO 4: Build Final

### 4.1 Preparar Backend

```bash
# 1. Ir al backend
cd backend

# 2. Build con PyInstaller
pyinstaller photobooth-backend.spec

# Verificar que existe: backend/dist/photobooth-backend.exe
```

### 4.2 Build Frontend + Backend

```bash
# 1. Ir al frontend
cd frontend-new

# 2. Build completo (incluye backend)
npm run make

# Output en: out/make/
# - Windows: Photobooth-Setup.exe
# - macOS: Photobooth.dmg
# - Linux: photobooth.deb y photobooth.rpm
```

---

## 📥 PASO 5: Distribución al Cliente

### Para Windows:
```
1. Entregar: Photobooth-Setup.exe
2. Cliente hace doble click
3. Instalación automática
4. Icono en escritorio
5. ¡Listo!
```

### Para macOS:
```
1. Entregar: Photobooth.dmg
2. Montar DMG
3. Arrastrar a Aplicaciones
4. Abrir desde Launchpad
5. ¡Listo!
```

### Para Linux:
```
Ubuntu/Debian:
sudo dpkg -i photobooth.deb

Fedora/CentOS:
sudo rpm -i photobooth.rpm
```

---

## 🔍 TESTING ANTES DE ENTREGAR

### Checklist de Testing:

- [ ] Backend inicia automáticamente
- [ ] Frontend se conecta al backend
- [ ] Cámara funciona correctamente
- [ ] Captura de fotos funciona
- [ ] Impresión funciona (si aplica)
- [ ] Voces en español funcionan
- [ ] Sonidos funcionan
- [ ] Auto-reset funciona
- [ ] Backend se cierra al cerrar app
- [ ] No quedan procesos zombie
- [ ] Funciona sin conexión a internet
- [ ] Instalador crea icono en escritorio
- [ ] Desinstalador funciona correctamente

### Testing en Producción:

```bash
# Test 1: Verificar que backend está empaquetado
cd frontend-new/out/Photobooth-darwin-x64
ls -la Photobooth.app/Contents/Resources/backend/

# Test 2: Ejecutar y ver logs
open Photobooth.app

# Test 3: Ver procesos
ps aux | grep photobooth
```

---

## 🆘 TROUBLESHOOTING

### Backend no inicia
**Problema**: Error "Backend failed to start"

**Solución**:
1. Verificar que `backend/dist/photobooth-backend` existe
2. Verificar permisos de ejecución
3. Ver logs en desarrollo:
   ```typescript
   stdio: 'pipe' // en backend-manager.ts
   ```

### Puerto 8000 ocupado
**Problema**: Backend no puede usar puerto 8000

**Solución**:
1. Cambiar puerto en backend
2. Actualizar frontend para usar nuevo puerto
3. O matar proceso que usa puerto 8000

### App tarda en abrir
**Problema**: Ventana tarda mucho en aparecer

**Solución**:
1. Reducir `maxRetries` en backend-manager
2. Mostrar splash screen mientras backend inicia
3. Optimizar inicio del backend

---

## 🎨 MEJORAS OPCIONALES

### 1. Splash Screen
Mostrar pantalla de carga mientras backend inicia:

```typescript
const splashWindow = new BrowserWindow({
  width: 400,
  height: 300,
  transparent: true,
  frame: false,
  alwaysOnTop: true,
});

splashWindow.loadFile('splash.html');

// Cerrar splash cuando app esté lista
await backendManager.start();
splashWindow.close();
```

### 2. Auto-Updates
Implementar actualizaciones automáticas con Squirrel:

```bash
npm install electron-squirrel-startup electron-updater
```

### 3. Crash Reporter
Enviar reportes de crash para debugging:

```typescript
import { crashReporter } from 'electron';

crashReporter.start({
  submitURL: 'https://your-crash-server.com/report',
  uploadToServer: true,
});
```

---

## 📚 RECURSOS

- [Electron Packaging](https://www.electronjs.org/docs/latest/tutorial/application-distribution)
- [PyInstaller Docs](https://pyinstaller.org/)
- [Electron Forge Docs](https://www.electronforge.io/)
- [Code Signing](https://www.electronjs.org/docs/latest/tutorial/code-signing)

---

## ✅ RESULTADO FINAL

**Lo que ve tu cliente:**
```
1. Recibe archivo: "Photobooth-Setup.exe"
2. Doble click para instalar
3. Icono en escritorio: "Photobooth"
4. Doble click en icono
5. App abre instantáneamente
6. Todo funciona
```

**Lo que NO ve:**
- Docker ❌
- Terminal ❌
- Comandos ❌
- Puerto 8000 ❌
- Backend ❌
- Python ❌

**Solo ve una aplicación normal como Chrome, Spotify, etc.** ✅

---

**¿Necesitas ayuda implementando esto?** Puedo crear todos los archivos necesarios.
