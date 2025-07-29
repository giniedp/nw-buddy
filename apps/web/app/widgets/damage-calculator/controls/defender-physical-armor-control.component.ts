import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NwModule } from '~/nw'
import { DamageCalculatorStore, defenderAccessor } from '../damage-calculator.store'
import { StackedValueControlComponent } from './stacked-value-control.component'

@Component({
  selector: 'nwb-defender-physical-armor-control',
  templateUrl: './defender-physical-armor-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, StackedValueControlComponent],
  host: {
    class: 'fieldset',
  },
})
export class DefenderPhysicalArmorControlComponent {
  protected store = inject(DamageCalculatorStore)

  protected rating = this.store.defenderPhysicalArmor
  protected armor = defenderAccessor(this.store, 'physicalArmor')
  protected armorFortify = defenderAccessor(this.store, 'physicalArmorFortify')
  protected armorAdd = defenderAccessor(this.store, 'physicalArmorAdd')

  protected get isBound() {
    return this.store.defender.isBound()
  }

  protected get lockPreset() {
    return !!this.store.defenderVitalId() || this.isBound
  }
}
