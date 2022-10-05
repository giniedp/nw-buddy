import { Component, OnInit } from '@angular/core'
import { APP_CONFIG } from 'apps/web/environments/environment'

@Component({
  selector: 'nwb-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {

  public get version() {
    return APP_CONFIG.version
  }

  public get gameVersion() {
    const version = APP_CONFIG.version.split('-')[0]
    if (APP_CONFIG.isPTR) {
      return `Public Test Realm ${version}`
    }
    return '1.6.6'
    // return APP_CONFIG.version.split('-')[0]
  }

  constructor() { }

  ngOnInit(): void {
  }

}
