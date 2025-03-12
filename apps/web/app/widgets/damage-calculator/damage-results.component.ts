import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { NwModule } from '~/nw'
import { TooltipModule } from '~/ui/tooltip'
import { DamageCalculatorStore } from './damage-calculator.store'
import { FloorPipe } from './pipes/floor.pipe'

@Component({
  selector: 'nwb-damage-results',
  templateUrl: './damage-results.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FloorPipe, TooltipModule],
  host: {
    class: 'block',
  },
})
export class DamageResultsComponent {
  protected store = inject(DamageCalculatorStore)

  protected get dotOutput() {
    if (!this.store.offenderDotIsActive()) {
      return null
    }
    return this.store.output().dot
  }
}
