import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';

const DEFAULT_WINDOW_WIDTH = 1920;
const DEFAULT_WINDOW_HEIGHT = 1080;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Environment variables for production mode
const isDevelopment = process.env.NODE_ENV === 'development' || MAIN_WINDOW_VITE_DEV_SERVER_URL;
const kioskEnv = process.env.KIOSK_MODE;
const isKioskMode = kioskEnv ? kioskEnv === 'true' : !isDevelopment;

let mainWindow: BrowserWindow | null = null;

// Single instance lock - prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, focus our window
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      const mainWindow = windows[0];
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

const createWindow = () => {
  // Create the browser window with optimized settings
  mainWindow = new BrowserWindow({
    width: isKioskMode ? undefined : DEFAULT_WINDOW_WIDTH,
    height: isKioskMode ? undefined : DEFAULT_WINDOW_HEIGHT,
    fullscreen: isKioskMode,
    kiosk: isKioskMode,
    show: false, // Show when ready to avoid flickering
    autoHideMenuBar: true,
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, // Security: disable node integration
      contextIsolation: true, // Security: enable context isolation
      webSecurity: false, // Allow loading images from localhost backend
      backgroundThrottling: false, // Important for photobooth - keep animations running
      spellcheck: false, // Disable spellcheck for performance
    },
  });

  // Disable GPU on Linux if needed (uncomment if you have GPU issues)
  // if (process.platform === 'linux') {
  //   app.disableHardwareAcceleration();
  // }

  // Load the index.html of the app
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Show window when ready to avoid flickering
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development mode
  if (isDevelopment) {
    mainWindow.webContents.openDevTools();
  }

  // Memory optimization: call garbage collection when window is closed
  mainWindow.on('closed', () => {
    if (global.gc) {
      global.gc();
    }
    mainWindow = null;
  });

  // Register global hotkey for settings
  const settingsHotkey = 'CommandOrControl+Shift+S';
  const registered = globalShortcut.register(settingsHotkey, () => {
    console.log('Settings hotkey pressed');
    mainWindow.webContents.send('open-settings');
  });

  if (!registered) {
    console.warn(`Failed to register hotkey: ${settingsHotkey}`);
  } else {
    console.log(`✅ Hotkey registered: ${settingsHotkey}`);
  }

  return mainWindow;
};

ipcMain.handle('set-kiosk-mode', (_event, enable: boolean) => {
  if (!mainWindow) {
    return false;
  }
  mainWindow.setKiosk(enable);
  mainWindow.setFullScreen(enable);
  if (!enable) {
    mainWindow.show();
  }
  return true;
});

ipcMain.handle('exit-kiosk', () => {
  if (!mainWindow) {
    return false;
  }
  mainWindow.setKiosk(false);
  mainWindow.setFullScreen(false);
  mainWindow.show();
  mainWindow.focus();
  return true;
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  // Unregister all shortcuts when app is closing
  globalShortcut.unregisterAll();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Unregister shortcuts when app is quitting
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
