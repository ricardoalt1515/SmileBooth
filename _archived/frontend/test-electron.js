const { app, BrowserWindow } = require('electron')

console.log('✅ Electron app object:', app)
console.log('✅ Electron isPackaged:', app.isPackaged)

app.whenReady().then(() => {
  console.log('✅ Electron is ready!')
  const win = new BrowserWindow({ width: 800, height: 600 })
  win.loadURL('https://www.google.com')
  
  setTimeout(() => {
    console.log('✅ Test passed! Electron works correctly.')
    app.quit()
  }, 3000)
})
