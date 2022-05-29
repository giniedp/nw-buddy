import { ChangeDetectorRef, Component } from '@angular/core'

import { TranslateService } from '@ngx-translate/core'
import { ElectronService } from './core/electron'
import { LocaleService } from './core/i18n'
import { AppPreferencesService } from './core/preferences'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {

  public get isElectron() {
    return this.electron.isElectron
  }

  constructor(
    private electron: ElectronService,
    private translate: TranslateService,
    private locale: LocaleService,
    private app: AppPreferencesService,
    private cdRef: ChangeDetectorRef
  ) {
    this.app.language.observe().subscribe((value) => {
      this.locale.use(value)
    })
    this.translate.setDefaultLang('en')
    if (electron.isElectron) {
      console.log(process.env)
      console.log('Run in electron')
      console.log('Electron ipcRenderer', this.electron.ipcRenderer)
      console.log('NodeJS childProcess', this.electron.childProcess)
    } else {
      console.log('Run in browser')
    }
  }
}
