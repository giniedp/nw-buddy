import { BrowserWindow, Menu, MenuItem, WebContents, WebContentsView, app, ipcMain, shell } from 'electron'
import * as path from 'path'
import * as url from 'url'
import { loadConfig, writeConfig } from './config'
import { windowState } from './window-state'
import { appTabs } from './modules/app-tabs'
import { prepareWebContents } from './prepare-web-contents'

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('nw-buddy', process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('nw-buddy')
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  try {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      // Someone tried to run a second instance, we should focus our window.
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore()
        }
        mainWindow.focus()
        const deepLink = commandLine.find((it) => it.startsWith('nw-buddy://'))
        if (deepLink) {
          mainWindow.webContents.send('open-url', deepLink)
        }
      }
    })
    // Handle the protocol.
    app.on('open-url', (event, url) => {
      event.preventDefault()
      mainWindow.webContents.send('open-url', url)
    })

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    app.on('ready', createWindow)

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
      if (mainWindow === null) {
        createWindow()
      }
    })
  } catch (e) {
    // Catch Error
    // throw e;
  }
}

const menu = new Menu()
menu.append(
  new MenuItem({
    label: 'Electron',
    submenu: [
      {
        role: 'toggleDevTools',
        accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Alt+Shift+I',
        click: () => {
          mainWindow.webContents.openDevTools()
        },
      },
    ],
  }),
)

Menu.setApplicationMenu(menu)

let mainWindow: BrowserWindow = null
const args = process.argv.slice(1)
const serve = args.some((val) => val === '--serve')

const config = loadConfig()
const winState = windowState({
  load: () => config.window,
  save: (state) => {
    config.window = state
    writeConfig(config)
  },
})

function createWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    x: config?.window?.x,
    y: config?.window?.y,
    width: config?.window?.width,
    height: config?.window?.height,
    resizable: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: serve ? true : false,
      contextIsolation: false,
      webviewTag: true,
    },
    frame: false,
  })
  app.whenReady().then(() => {
    winState.manage(mainWindow)
  })

  prepareWebContents(mainWindow.webContents, mainWindow)
  mainWindow.webContents.on('did-attach-webview', (e, contents) => {
    prepareWebContents(contents, mainWindow)
  })

  if (serve) {
    require('electron-reload')(__dirname, {
      electron: require(path.join(__dirname, '/../../node_modules/electron')),
    })
    mainWindow.webContents.openDevTools()
    mainWindow.loadURL('http://localhost:4200/electron')
  } else {
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, '../web-electron/browser/index.html'),
        protocol: 'file:',
        slashes: true,
      }),
    )
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  ipcMain.handle('window-close', async () => {
    mainWindow.close()
  })
  ipcMain.handle('window-minimize', async () => {
    mainWindow.minimize()
  })
  ipcMain.handle('window-maximize', async () => {
    mainWindow.maximize()
  })
  ipcMain.handle('window-unmaximize', async () => {
    mainWindow.unmaximize()
  })
  ipcMain.handle('is-window-maximized', async () => {
    return mainWindow.isMaximized()
  })
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-change')
  })
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-change')
  })
  return mainWindow
}
