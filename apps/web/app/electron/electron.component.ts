import { DOCUMENT } from '@angular/common'
import { Component, NO_ERRORS_SCHEMA, inject, signal } from '@angular/core'
import { IonContent, IonHeader, IonToolbar } from '@ionic/angular/standalone'
import { svgPlus } from '~/ui/icons/svg/plus'
import { ElectronService } from './electron.service'
import { TitleBarComponent } from './title-bar.component'
import { IconsModule } from '~/ui/icons'
import { AppSkeletonService } from '../app-skeleton.service'

export interface AppTab {
  id: number
  title: string
  active: boolean
  src: string
}

@Component({
  selector: 'nw-buddy-electron',
  templateUrl: './electron.component.html',
  styleUrl: './electron.component.css',
  host: {
    class: 'ion-page',
  },
  imports: [TitleBarComponent, IconsModule, IonHeader, IonContent],
  schemas: [NO_ERRORS_SCHEMA],
})
export class ElectronComponent {
  private service = inject(ElectronService)
  private skeleton = inject(AppSkeletonService)
  private document = inject(DOCUMENT)
  protected iconPlus = svgPlus

  constructor() {
    this.document.querySelectorAll('[data-skeleton]').forEach((el) => el.remove())
    this.bindEvents()
    this.createTab()
    this.skeleton.removeWithNoDelay()
  }

  protected tabs = signal<AppTab[]>([])

  public activateTab(tab: AppTab) {
    this.tabs.set(this.tabs().map((it) => ({ ...it, active: it.id === tab.id })))
  }

  public closeTab(tab: AppTab) {
    if (this.tabs().length === 1) {
      return
    }
    const tabs = [...this.tabs()]
    const index = tabs.findIndex((it) => it.id === tab.id)
    if (index < 0) {
      return
    }
    tabs.splice(index, 1)
    this.tabs.set(tabs)
    if (tab.active) {
      const next = tabs[index] || tabs[index - 1]
      this.activateTab(next)
    }
  }

  public createTab(url: string = location.origin) {
    const tabs = [...this.tabs()]
    for (const tab of tabs) {
      tab.active = false
    }
    tabs.push({ id: Date.now(), title: 'New Tab', active: true, src: url })
    this.tabs.set(tabs)
  }

  protected syncTitle(event: Event, tab: AppTab) {
    const title: string = event['title']
    this.tabs.set(
      this.tabs().map((it) => {
        if (it.id === tab.id) {
          return {
            ...it,
            title: title?.replace(/^New World Buddy - /, ''),
          }
        }
        return it
      }),
    )
  }
  private bindEvents() {
    if (!this.service.isElectron) {
      return
    }
    this.service.ipc.addListener('open-tab', (event, url: string) => {
      this.createTab(url)
    })
  }
}
