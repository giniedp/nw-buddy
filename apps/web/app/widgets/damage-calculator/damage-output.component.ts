import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { NwModule } from '~/nw'
import { TooltipModule } from '~/ui/tooltip'
import { DamageCalculatorStore } from './damage-calculator.store'
import { FloorPipe } from './pipes/floor.pipe'

@Component({
  standalone: true,
  selector: 'nwb-damage-output',
  templateUrl: './damage-output.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FloorPipe, TooltipModule],
  host: {
    class: 'layout-content',
  },
})
export class DamageOutputComponent {
  protected store = inject(DamageCalculatorStore)

  protected get dotOutput() {
    if (!this.store.offenderDotIsActive()){
      return null
    }
    return this.store.output().dot
  }
}
