import { Component, HostBinding } from '@angular/core'
import { sortBy } from 'lodash'
import { APP_CONFIG } from '../environments/environment'

import { ElectronService } from './electron'
import { TranslateService } from './i18n'

import { LANG_OPTIONS, MAIN_MENU } from './menu'
import { AppPreferencesService } from './preferences'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  host: {
    class: 'layout-frame layout-col layout-gap',
  },
})
export class AppComponent {
  @HostBinding('class.is-electron')
  public get isElectron() {
    return this.electron.isElectron
  }

  @HostBinding('class.is-web')
  public get isWeb() {
    return APP_CONFIG.environment === 'WEB' || APP_CONFIG.environment === 'DEV'
  }

  public get language() {
    return this.preferences.language.get()
  }
  public set language(value: string) {
    this.preferences.language.set(value)
  }

  protected mainMenu = MAIN_MENU
  protected langOptions = LANG_OPTIONS

  constructor(
    private preferences: AppPreferencesService,
    private electron: ElectronService,
    translate: TranslateService
  ) {
    preferences.language.observe().subscribe((locale) => translate.use(locale))
  }
}
