import { CommonModule } from '@angular/common'
import { Component, OnInit } from '@angular/core'
import { APP_CONFIG } from 'apps/web/environments/environment'

@Component({
  standalone: true,
  selector: 'nwb-about-page',
  templateUrl: './about.component.html',
  imports: [CommonModule],
  host: {
    class: 'layout-col'
  }
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
    return APP_CONFIG.version.split('-')[0]
  }

  constructor() {}

  ngOnInit(): void {}
}
