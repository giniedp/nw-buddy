import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy, inject } from '@angular/core'
import { NwModule } from '~/nw'
import { DamageCalculatorStore, defenderAccessor } from './damage-calculator.store'
import { NW_MAX_CHARACTER_LEVEL, NW_MAX_GEAR_SCORE } from '@nw-data/common'
import { FormsModule } from '@angular/forms'
import { InputSliderComponent } from '~/ui/input-slider'
import { LayoutModule } from '~/ui/layout'

@Component({
  standalone: true,
  selector: 'nwb-ctrl-defender',
  templateUrl: './ctrl-defender.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, InputSliderComponent, LayoutModule],
  host: {
    class: 'form-control',
  },
})
export class CtrDefenderComponent {
  protected store = inject(DamageCalculatorStore)

  protected level = defenderAccessor(this.store, 'level')
  protected gearScore = defenderAccessor(this.store, 'gearScore')

  protected levelMin = 1
  protected levelMax = NW_MAX_CHARACTER_LEVEL

  protected gsMin = 0
  protected gsMax = NW_MAX_GEAR_SCORE

}
