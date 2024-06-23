import { BrowserWindow, WebContentsView, ipcMain } from 'electron'

export interface AppTab {
  id: number
  active: boolean
  title?: string
}

export interface AppTabsOptions {
  offset: number
}

export function appTabs(window: BrowserWindow, { offset }: AppTabsOptions) {
  const tabs: AppTab[] = []
  const views: Record<number, WebContentsView> = {}

  function createTab(url: string) {
    const id = Math.max(...tabs.map((tab) => tab.id), 0) + 1
    const view = new WebContentsView({
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        allowRunningInsecureContent: true,
      },
    })
    tabs.push({ id, title: 'Tab', active: false })
    views[id] = view

    window.contentView.addChildView(view)

    view.webContents.on('page-title-updated', (event, title) => {
      const tab = tabs.find((tab) => tab.id === id)
      if (tab) {
        tab.title = title
      }
      window.webContents.send('app-tabs:update', tabs)
    })
    view.webContents.loadURL(url)
    showTab(id)
  }

  function showTab(id: number) {
    const winBounds = window.contentView.getBounds()
    for (const tab of tabs) {
      tab.active = tab.id === id
      views[id].setVisible(tab.active)
      views[id].setBounds({ x: 0, y: offset, width: winBounds.width, height: winBounds.height - offset })
      tab.title = views[id].webContents.getTitle()
      console.log(tab.id, tab.active ? 'visible' : 'hidden', tab.title)
    }
  }

  function closeTab(id: number) {
    if (tabs.length === 1) {
      return
    }

    const index = tabs.findIndex((tab) => tab.id === id)
    if (index < 0) {
      return
    }

    const view = views[id]
    tabs.splice(index, 1)
    delete views[id]

    if (view) {
      window.contentView.removeChildView(view)
    }

    return index
  }

  function handleResize() {
    const id = tabs.find((tab) => tab.active)?.id
    showTab(id)
  }

  function handleUpdate(list: AppTab[]) {
    tabs.sort((a, b) => {
      const aIndex = list.findIndex((it) => it.id === a.id)
      const bIndex = list.findIndex((it) => it.id === b.id)
      return aIndex - bIndex
    })
    for (const tab of tabs) {
      const state = list.find((it) => it.id === tab.id)
      tab.active = state?.active || false
    }
    const activeTab = tabs.find((tab) => tab.active) || tabs[0]
    showTab(activeTab.id)
  }

  function handleClose(id: number) {
    const index = closeTab(id)
    const tab = tabs[index] || tabs[tabs.length - 1]
    showTab(tab.id)
  }

  ipcMain.handle('app-tabs:list', async () => tabs)
  ipcMain.handle('app-tabs:update', async (event, list: AppTab[]) => {
    handleUpdate(list)
    return tabs
  })
  ipcMain.handle('app-tabs:destroy', async (event, { id }: { id: number }) => {
    handleClose(id)
    return tabs
  })
  ipcMain.handle('app-tabs:create', async (event, { url }: { url: string }) => {
    createTab(url)
    return tabs
  })
  // window.on('resized', () => handleResize())
  // window.on('resize', () => handleResize())
  // window.on('maximize', () => handleResize())
  // window.on('unmaximize', () => handleResize())
  window.contentView.on('bounds-changed', () => handleResize())
  return {
    createTab,
    showTab,
    closeTab,
  }
}
