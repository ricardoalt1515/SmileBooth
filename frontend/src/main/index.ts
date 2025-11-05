/**
 * Photobooth Electron Main Process
 * Optimizado para bajos recursos y uso en eventos
 */
import { app, shell, BrowserWindow, ipcMain } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";

let mainWindow: BrowserWindow | null = null;

// Optimización: Deshabilitar GPU en Linux si no es necesaria
if (process.platform === "linux") {
	app.disableHardwareAcceleration();
}

function createWindow(): void {
	// Create the browser window - optimizado para kiosk mode
	mainWindow = new BrowserWindow({
		width: 1280,
		height: 800,
		show: false,
		fullscreen: false, // Cambiar a true para modo kiosk en producción
		autoHideMenuBar: true,
		...(process.platform === "linux" ? { icon } : {}),
		webPreferences: {
			preload: join(__dirname, "../preload/index.js"),
			sandbox: false,
			backgroundThrottling: false, // No ralentizar cuando esté en background
		},
	});

	mainWindow.on("ready-to-show", () => {
		mainWindow?.show();
	});

	mainWindow.webContents.setWindowOpenHandler((details) => {
		shell.openExternal(details.url);
		return { action: "deny" };
	});

	// HMR for renderer base on electron-vite cli.
	if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
		mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
		mainWindow.webContents.openDevTools();
	} else {
		mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
	}

	// Liberar memoria cuando se cierra
	mainWindow.on("closed", () => {
		mainWindow = null;
		if (global.gc) {
			global.gc();
		}
	});
}

// Optimización: Single instance lock (solo una instancia de la app)
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
	app.quit();
} else {
	app.on("second-instance", () => {
		// Si alguien intenta abrir otra instancia, enfocamos la existente
		if (mainWindow) {
			if (mainWindow.isMinimized()) mainWindow.restore();
			mainWindow.focus();
		}
	});

	// This method will be called when Electron has finished initialization
	app.whenReady().then(() => {
		// Set app user model id for windows
		electronApp.setAppUserModelId("com.photobooth");

		// Default open or close DevTools by F12 in development
		app.on("browser-window-created", (_, window) => {
			optimizer.watchWindowShortcuts(window);
		});

		// IPC test
		ipcMain.on("ping", () => console.log("pong"));

		createWindow();

		app.on("activate", function () {
			// On macOS it's common to re-create a window in the app when the
			// dock icon is clicked and there are no other windows open.
			if (BrowserWindow.getAllWindows().length === 0) createWindow();
		});
	});
}

// Quit when all windows are closed, except on macOS.
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

// Optimización: Limpiar recursos antes de cerrar
app.on("before-quit", () => {
	mainWindow = null;
	if (global.gc) {
		global.gc();
	}
});
