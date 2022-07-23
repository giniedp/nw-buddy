import { ChangeDetectorRef, Component, ElementRef, QueryList, ViewChildren } from '@angular/core'
import { take } from 'rxjs'

import { ElectronService } from './core/electron'
import { LocaleService, TranslateService } from './core/i18n'
import { NwDbService } from './core/nw'
import { AppPreferencesService } from './core/preferences'
import { Hotkeys } from './core/utils'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  host: {
    class: 'layout-frame layout-column',
  },
})
export class AppComponent {
  public get isElectron() {
    return this.electron.isElectron
  }

  public get language() {
    return this.app.language.get()
  }
  public set language(value: string) {
    this.db.data
      .loadTranslations(value)
      .pipe(take(1))
      .subscribe((data) => {
        this.translate.merge(value, data)
        this.app.language.set(value)
      })
  }

  @ViewChildren('link')
  public tabs: QueryList<ElementRef<HTMLAnchorElement>>

  constructor(
    private locale: LocaleService,
    private translate: TranslateService,
    private electron: ElectronService,
    private app: AppPreferencesService,
    private db: NwDbService,
    private cdRef: ChangeDetectorRef,
    private hotkeys: Hotkeys
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
