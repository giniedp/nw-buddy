import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core'
import { sortBy } from 'lodash'

import { ElectronService } from './electron'
import { TranslateService } from './i18n'

import { AppPreferencesService } from './preferences'
import { Hotkeys } from './utils'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  host: {
    class: 'layout-frame layout-column p-0 md:p-3 gap-2 md:gap-4',
  },
})
export class AppComponent {
  public get isElectron() {
    return this.electron.isElectron
  }

  public get language() {
    return this.preferences.language.get()
  }
  public set language(value: string) {
    this.preferences.language.set(value)
  }

  protected links = sortBy(
    [
      {
        url: 'https://nwdb.info/',
        label: 'nwdb.info',
      },
      {
        url: 'https://www.nw-tools.info/',
        label: 'www.nw-tools.info',
      },
      {
        url: 'https://gaming.tools/newworld/',
        label: 'gaming.tools',
      },
      {
        url: 'https://new-world.exchange/',
        label: 'new-world.exchange',
      },
      {
        url: 'https://nwmarketprices.com/',
        label: 'nwmarketprices.com',
      },
      {
        url: 'https://newworldfans.com/',
        label: 'newworldfans.com',
      },
      {
        url: 'https://www.newworld-map.com/',
        label: 'newworld-map.com',
      },
      {
        url: 'https://mapgenie.io/new-world',
        label: 'mapgenie.io',
      },
      {
        url: 'https://raidplan.io/newworld',
        label: 'raidplan.io'
      }
    ],
    (it) => it.label
  )

  @ViewChildren('link')
  public tabs: QueryList<ElementRef<HTMLAnchorElement>>

  constructor(
    private preferences: AppPreferencesService,
    private electron: ElectronService,
    private hotkeys: Hotkeys,
    translate: TranslateService
  ) {
    preferences.language.observe().subscribe((locale) => translate.use(locale))

    ;[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].forEach((i) => {
      this.hotkeys
        .addShortcut({
          keys: `control.${i}`,
        })
        .subscribe(() => {
          this.tabs.get((i || 10) - 1)?.nativeElement?.click()
        })
    })
  }
}
