import { DOCUMENT } from '@angular/common'
import { Component, NO_ERRORS_SCHEMA, inject } from '@angular/core'
import { IonToolbar } from '@ionic/angular/standalone'
import { ElectronService } from './electron.service'
import { TitleBarComponent } from './title-bar.component'
import { AppTabsComponent } from './app-tabs.component'

@Component({
  standalone: true,
  selector: 'nw-buddy-electron',
  templateUrl: './electron.component.html',
  styleUrl: './electron.component.scss',
  host: {
    class: 'ion-page',
  },
  imports: [TitleBarComponent, AppTabsComponent, IonToolbar],
  schemas: [NO_ERRORS_SCHEMA]
})
export class ElectronComponent {
  private service = inject(ElectronService)
  private document = inject(DOCUMENT)

  constructor() {
    this.document.querySelectorAll('[data-skeleton]').forEach((el) => el.remove())
  }
}
