const { app, BrowserWindow, shell, session, ipcMain } = require('electron')
const path = require('path')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    title: 'LendWise LMS',
    icon: path.join(__dirname, 'build', process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
    // Fully frameless — we draw our own titlebar in HTML
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    backgroundColor: '#060d08',
    show: false,
  })

  // Remove the default menu bar entirely
  mainWindow.setMenuBarVisibility(false)
  mainWindow.setAutoHideMenuBar(true)

  mainWindow.loadFile('index.html')

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // IPC: window controls from renderer
  ipcMain.on('win-minimize', () => mainWindow.minimize())
  ipcMain.on('win-maximize', () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize()
    else mainWindow.maximize()
  })
  ipcMain.on('win-close', () => mainWindow.close())

  // Tell renderer when maximize state changes so icon can update
  mainWindow.on('maximize',   () => mainWindow.webContents.send('win-maximized', true))
  mainWindow.on('unmaximize', () => mainWindow.webContents.send('win-maximized', false))

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://') && !url.startsWith('https://pzxitzwxmlawtxegmjns.supabase.co')) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(() => {
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    callback({ requestHeaders: details.requestHeaders })
  })
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})