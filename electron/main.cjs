const { app, BrowserWindow } = require('electron')
const path = require('path')
const fs = require('fs')

const iconPath = path.join(__dirname, '..', 'build', 'icon.png')

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Sonidos de la Pasión',
    ...(fs.existsSync(iconPath) ? { icon: iconPath } : {}),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  const indexHtml = path.join(__dirname, '..', 'dist', 'index.html')
  win.loadFile(indexHtml)
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
