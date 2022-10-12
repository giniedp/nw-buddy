import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { uniqueId } from 'lodash'
import { ScreenDrawerService } from './screen-drawer.service'

@Component({
  standalone: true,
  selector: 'nwb-screen-drawer',
  template: `
    <input [ngModel]="drawer.isOpen$ | async" type="checkbox" class="drawer-toggle" />
    <ng-content></ng-content>
  `,
  imports: [CommonModule, FormsModule],
  host: {
    class: 'drawer drawer-mobile screen-gap',
  },
})
export class ScreenDrawerComponent {

  public constructor(protected drawer: ScreenDrawerService) {

  }
}
