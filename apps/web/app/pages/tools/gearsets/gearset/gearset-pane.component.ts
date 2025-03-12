import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'

@Component({
  selector: 'nwb-gearset-pane',
  template: `
    <div class="nw-bg-pane absolute inset-0 bg-center bg-cover"></div>
    <ng-content></ng-content>
  `,
  host: {
    class: 'shadow-lg rounded-md overflow-clip bg-black relative',
  },
  imports: [CommonModule],
})
export class GearsetPaneComponent {}
