import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy } from '@angular/core'
import { NwModule } from '~/nw'

@Component({
  standalone: true,
  selector: 'nwb-gearset-card-slot',
  templateUrl: './card-slot.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule],
  host: {
    class: 'layout-content',
  },
})
export class GearsetCardSlotComponent {
  public constructor() {
    //
  }
}
