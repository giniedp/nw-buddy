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
    return '1.6.4'
    // return APP_CONFIG.version.split('-')[0]
  }

  constructor() { }

  ngOnInit(): void {
  }

}
