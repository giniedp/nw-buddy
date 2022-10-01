import { Injectable } from '@angular/core'

import type { ipcRenderer } from 'electron'
import { Subject } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class ElectronService {
  private ipcRenderer: typeof ipcRenderer

  public windowChange = new Subject()

  constructor() {
    if (this.isElectron) {
      this.ipcRenderer = window.require('electron').ipcRenderer
      this.ipcRenderer.addListener('window-change', () => {
        this.windowChange.next(null)
      })
    }
  }

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type)
  }

  public sendWindowClose() {
    this.ipcRenderer?.invoke('window-close')
  }
  public sendWindowMin() {
    this.ipcRenderer?.invoke('window-minimize')
  }
  public sendWindowMax() {
    this.ipcRenderer?.invoke('window-maximize')
  }
  public sendWindowRestore() {
    this.ipcRenderer?.invoke('window-unmaximize')
  }
  public isWindowMaximized(): Promise<boolean> {
    return this.ipcRenderer?.invoke('is-window-maximized')
  }
}
