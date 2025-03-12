import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, NO_ERRORS_SCHEMA, inject } from '@angular/core'
import { NwModule } from '~/nw'
import { TooltipModule } from '~/ui/tooltip'
import { DamageCalculatorStore } from './damage-calculator.store'
import { FloorPipe } from './pipes/floor.pipe'

@Component({
  selector: 'nwb-damage-output',
  templateUrl: './damage-output.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FloorPipe, TooltipModule],
  host: {
    class: 'flex flex-col items-center',
  },
})
export class DamageOutputComponent {
  protected store = inject(DamageCalculatorStore)
  protected get trace() {
    return this.store.output().trace
  }
}
