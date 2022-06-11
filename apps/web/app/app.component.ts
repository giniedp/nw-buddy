import { ChangeDetectorRef, Component } from '@angular/core'
import { take } from 'rxjs'

import { ElectronService } from './core/electron'
import { LocaleService, TranslateService } from './core/i18n'
import { NwDbService } from './core/nw'
import { AppPreferencesService } from './core/preferences'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  host: {
    class: 'layout-frame layout-column'
  }
})
export class AppComponent {

  public get isElectron() {
    return this.electron.isElectron
  }

  public get language() {
    return this.app.language.get()
  }
  public set language(value: string) {
    this.db.data.loadTranslations(value).pipe(take(1)).subscribe((data) => {
      this.translate.merge(value, data)
      this.app.language.set(value)
    })
  }

  constructor(
    private locale: LocaleService,
    private translate: TranslateService,
    private electron: ElectronService,
    private app: AppPreferencesService,
    private db: NwDbService,
    private cdRef: ChangeDetectorRef
  ) {
    this.app.language.observe().subscribe((value) => {
      this.locale.use(value)
    })
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
