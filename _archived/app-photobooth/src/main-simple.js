// main-simple.js - Versión mínima para testing
const { app, BrowserWindow } = require('electron');

console.log('🚀 Main process iniciado');
console.log('Electron version:', process.versions.electron);
console.log('Node version:', process.versions.node);

app.whenReady().then(() => {
  console.log('✅ App is ready!');
  
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    backgroundColor: '#ffffff'
  });

  console.log('✅ Window created');
  
  win.loadURL('data:text/html,<h1>TEST - Electron funciona!</h1>');
  
  win.webContents.openDevTools();
  
  console.log('✅ Content loaded');
});

app.on('window-all-closed', () => {
  app.quit();
});
