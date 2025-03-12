import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy } from '@angular/core'
import { NwModule } from '~/nw'

@Component({
  standalone: true,
  selector: 'nwb-grid-select-state',
  template: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule],
  host: {
    class: 'layout-content',
  },
})
export class GridSelectStateComponent {
  public constructor() {
    //
  }
}
