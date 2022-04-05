import { Component } from '@angular/core'

import { TranslateService } from '@ngx-translate/core'
import { APP_CONFIG } from '../environments/environment'
import { ElectronService } from './core/electron'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor(private electronService: ElectronService, private translate: TranslateService) {
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
