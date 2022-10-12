import { Component, ElementRef, HostBinding, QueryList, ViewChildren } from '@angular/core'
import { sortBy } from 'lodash'

import { ElectronService } from './electron'
import { TranslateService } from './i18n'

import { AppPreferencesService } from './preferences'
import { Hotkeys } from './utils'
import { MAIN_MENU, EXTERN_MENU, LANG_OPTIONS } from './menu'


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  host: {
    class: 'layout-frame layout-column p-2 lg:p-4 screen-gap',
  },
})
export class AppComponent {
  @HostBinding('class.is-electron')
  public get isElectron() {
    return this.electron.isElectron
  }

  public get language() {
    return this.preferences.language.get()
  }
  public set language(value: string) {
    this.preferences.language.set(value)
  }

  protected mainMenu = MAIN_MENU
  protected links = sortBy(EXTERN_MENU, (it) => it.label)
  protected langOptions = LANG_OPTIONS

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
