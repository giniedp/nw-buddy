import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { NwModule } from '~/nw'
import { TooltipModule } from '~/ui/tooltip'
import { DamageCalculatorStore } from './damage-calculator.store'

@Component({
  selector: 'nwb-damage-output',
  templateUrl: './damage-output.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule],
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
