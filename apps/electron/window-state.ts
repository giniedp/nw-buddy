import { app, BrowserWindow, screen } from 'electron'

export interface WindowState {
  x: number
  y: number
  width: number
  height: number
  isMaximized?: boolean
  isFullScreen?: boolean
  displayBounds: Electron.Rectangle
}

function isWithinBounds(bounds: Electron.Rectangle, state: Partial<Electron.Rectangle>): boolean {
  return (
    !!state &&
    !!bounds &&
    state.x >= bounds.x &&
    state.y >= bounds.y &&
    state.x + state.width <= bounds.x + bounds.width &&
    state.y + state.height <= bounds.y + bounds.height
  )
}

function isRectangle(bounds: Partial<Electron.Rectangle>): bounds is Electron.Rectangle {
  return (
    !!bounds &&
    Number.isInteger(bounds.x) &&
    Number.isInteger(bounds.y) &&
    Number.isInteger(bounds.width) &&
    bounds.width > 0 &&
    Number.isInteger(bounds.height) &&
    bounds.height > 0
  )
}

function isStateValid(state: Partial<WindowState>) {
  if (!state) {

    return false
  }
  if (!isRectangle(state.displayBounds)) {

    return false
  }
  if (!isRectangle(state)) {
    return false
  }
  const display = screen.getAllDisplays().find((it) => isWithinBounds(it.bounds, state))
  return !!display
}

function createDefaultState(bounds: Partial<Electron.Rectangle>): WindowState {
  return {
    width: 800,
    height: 600,
    x: 0,
    y: 0,
    displayBounds: screen.getPrimaryDisplay().bounds,
    ...(bounds || {}),
  }
}

export function windowState(options: {
  defaultWidth?: number
  defaultHeight?: number
  save: (state: Partial<WindowState>) => void
  load: () => Partial<WindowState>
}) {
  let state: Partial<WindowState> = {}
  let winRef: BrowserWindow
  let stateChangeTimer: any
  const eventHandlingDelay = 100
  const config = {
    maximize: true,
    fullScreen: true,
    defaultWidth: options.defaultWidth || 800,
    defaultHeight: options.defaultHeight || 600,
  }

  // Load previous state
  try {
    state = (options.load() || {}) as any
  } catch (err) {
    console.error(err)
    state = {}
  }

  // Set state fallback values
  state = {
    width: config.defaultWidth || 800,
    height: config.defaultHeight || 600,
    ...(state || {}),
  }

  function resetState() {
    state = createDefaultState({
      width: config.defaultWidth,
      height: config.defaultHeight,
    })
  }

  function updateState(win: BrowserWindow = winRef) {
    if (!win) {
      return
    }
    // Don't throw an error when window was closed
    try {
      const bounds = win.getBounds()
      if (!win.isMaximized() && !win.isMinimized() && !win.isFullScreen()) {
        state.x = bounds.x
        state.y = bounds.y
        state.width = bounds.width
        state.height = bounds.height
      }
      state.isMaximized = win.isMaximized()
      state.isFullScreen = win.isFullScreen()
      state.displayBounds = screen.getDisplayMatching(bounds).bounds
    } catch (err) {}
  }

  function saveState(win?: BrowserWindow) {
    // Update window state only if it was provided
    if (win) {
      updateState(win)
    }

    // Save state
    try {
      options.save(state)
    } catch (err) {
      console.log(err)
    }
  }

  function stateChangeHandler() {
    // Handles both 'resize' and 'move'
    clearTimeout(stateChangeTimer)
    stateChangeTimer = setTimeout(updateState, eventHandlingDelay)
  }

  function closeHandler() {
    updateState()
  }

  function closedHandler() {
    // Unregister listeners and save state
    unmanage()
    saveState()
  }

  function manage(win: BrowserWindow) {
    if (!isStateValid(state)) {
      resetState()
      win.setBounds({
        x: state.x,
        y: state.y,
        width: state.width,
        height: state.height
      }, true)
    }
    if (config.maximize && state.isMaximized) {
      win.maximize()
    }
    if (config.fullScreen && state.isFullScreen) {
      win.setFullScreen(true)
    }
    win.on('resize', stateChangeHandler)
    win.on('move', stateChangeHandler)
    win.on('maximize', stateChangeHandler)
    win.on('unmaximize', stateChangeHandler)
    win.on('enter-full-screen', stateChangeHandler)
    win.on('leave-full-screen', stateChangeHandler)

    win.on('close', closeHandler)
    win.on('closed', closedHandler)
    winRef = win
  }

  function unmanage() {
    if (winRef) {
      winRef.removeListener('resize', stateChangeHandler)
      winRef.removeListener('move', stateChangeHandler)
      winRef.removeListener('maximize', stateChangeHandler)
      winRef.removeListener('unmaximize', stateChangeHandler)
      winRef.removeListener('enter-full-screen', stateChangeHandler)
      winRef.removeListener('leave-full-screen', stateChangeHandler)
      clearTimeout(stateChangeTimer)
      winRef.removeListener('close', closeHandler)
      winRef.removeListener('closed', closedHandler)
      winRef = null
    }
  }

  return {
    get x() {
      return state.x
    },
    get y() {
      return state.y
    },
    get width() {
      return state.width
    },
    get height() {
      return state.height
    },
    get displayBounds() {
      return state.displayBounds
    },
    get isMaximized() {
      return state.isMaximized
    },
    get isFullScreen() {
      return state.isFullScreen
    },
    saveState,
    unmanage,
    manage,
    resetStateToDefault: resetState,
  }
}
