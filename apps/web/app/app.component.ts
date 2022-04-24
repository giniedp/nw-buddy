import { Component } from '@angular/core'

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
  constructor(
    private electronService: ElectronService,
    private translate: TranslateService,
    private locale: LocaleService,
    private app: AppPreferencesService
  ) {
    this.app.language.observe().subscribe((value) => {
      this.locale.use(value)
    })
    this.translate.setDefaultLang('en')
    if (electronService.isElectron) {
      console.log(process.env)
      console.log('Run in electron')
      console.log('Electron ipcRenderer', this.electronService.ipcRenderer)
      console.log('NodeJS childProcess', this.electronService.childProcess)
    } else {
      console.log('Run in browser')
    }
  }
}
