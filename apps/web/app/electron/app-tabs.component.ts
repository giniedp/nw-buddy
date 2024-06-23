import { Component, NO_ERRORS_SCHEMA, computed, inject, signal } from '@angular/core'
import { IonContent, IonHeader, IonSegment, IonSegmentButton } from '@ionic/angular/standalone'
import { IconsModule } from '~/ui/icons'
import { svgPlus } from '~/ui/icons/svg'
import { ElectronService } from './electron.service'

export interface AppTab {
  id: number
  title: string
  active: boolean
  src: string
}

@Component({
  standalone: true,
  selector: 'nw-buddy-tabs',
  templateUrl: './app-tabs.component.html',
  styleUrl: './app-tabs.component.scss',
  host: {
    class: 'ion-page',
  },
  imports: [IconsModule, IonSegment, IonSegmentButton, IonHeader, IonContent],
  schemas: [NO_ERRORS_SCHEMA],
})
export class AppTabsComponent {
  protected tabs = signal<AppTab[]>([])
  protected activeTab = computed(() => this.tabs().find((it) => it.active))

  private service = inject(ElectronService)

  protected iconPlus = svgPlus
  public constructor() {
    this.bindEvents()
    this.createTab()
  }

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
    this.tabs.set(this.tabs().map((it) => {
      if (it.id === tab.id) {
        return {
          ...it,
          title: title?.replace(/^New World Buddy - /, '')
        }
      }
      return it
    }))
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
