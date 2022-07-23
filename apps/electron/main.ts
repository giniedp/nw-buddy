import { app, BrowserWindow, screen, shell, ipcMain } from 'electron'
import * as path from 'path'
import * as url from 'url'
import { loadConfig, writeConfig } from './config'
import { windowState } from './window-state'

let win: BrowserWindow = null
const args = process.argv.slice(1),

serve = args.some((val) => val === '--serve')

const config = loadConfig()
const winState = windowState({
  defaultWidth: 800,
  defaultHeight: 600,
  load: () => config.window,
  save: (state) => {
    config.window = state
    writeConfig(config)
  }
})

function createWindow(): BrowserWindow {
  // Create the browser window.
  win = new BrowserWindow({
    x: winState.x,
    y: winState.y,
    width: winState.width,
    height: winState.height,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: serve ? true : false,
      contextIsolation: false, // false if you want to run e2e test with Spectron
    },
    frame: false,
  })
  app.whenReady().then(() => {
    winState.manage(win)
  })


  win.webContents.on('new-window', function (e, url) {
    e.preventDefault()
    shell.openExternal(url)
  })

  if (serve) {
    win.webContents.openDevTools()
    require('electron-reload')(__dirname, {
      electron: require(path.join(__dirname, '/../../node_modules/electron')),
    })
    win.loadURL('http://localhost:4200')
  } else {
    win.loadURL(
      url.format({
        pathname: path.join(__dirname, '../web/index.html'),
        protocol: 'file:',
        slashes: true,
      })
    )
  }

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })

  ipcMain.handle('window-close', async () => {
    win.close()
  })
  ipcMain.handle('window-minimize', async () => {
    win.minimize()
  })
  ipcMain.handle('window-maximize', async () => {
    win.maximize()
  })
  ipcMain.handle('window-unmaximize', async () => {
    win.unmaximize()
  })
  ipcMain.handle('is-window-maximized', async () => {
    return win.isMaximized()
  })
  win.on('maximize', () => {
    win.webContents.send('window-change')
  })
  win.on('unmaximize', () => {
    win.webContents.send('window-change')
  })
  return win
}

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', () => setTimeout(createWindow, 400))

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow()
    }
  })
} catch (e) {
  // Catch Error
  // throw e;
}
