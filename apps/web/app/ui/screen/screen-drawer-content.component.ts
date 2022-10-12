import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'

@Component({
  standalone: true,
  selector: 'nwb-screen-drawer-content',
  template: `
    <ng-content></ng-content>
  `,
  imports: [CommonModule],
  host: {
    class: 'drawer-content',
  },
})
export class ScreenDrawerContentComponent {

}
