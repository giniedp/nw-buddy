import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy, inject } from '@angular/core'
import { NwModule } from '~/nw'
import { StackedValueControlComponent } from './stacked-value-control.component'
import { FormsModule } from '@angular/forms'
import { DamageCalculatorStore, offenderAccessor } from '../damage-calculator.store'

@Component({
  standalone: true,
  selector: 'nwb-offender-mods-control',
  templateUrl: './offender-mods-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, StackedValueControlComponent, FormsModule],
  host: {
    class: 'layout-content',
  },
})
export class OffenderModsControlComponent {
  protected store = inject(DamageCalculatorStore)

  protected modPvP = offenderAccessor(this.store, 'modPvP')
  protected modAmmo = offenderAccessor(this.store, 'modAmmo')
  protected modCrit = offenderAccessor(this.store, 'modCrit')
  protected modBase = offenderAccessor(this.store, 'modBase')
  protected modBaseConv = offenderAccessor(this.store, 'modBaseConv')
  protected modDMG = offenderAccessor(this.store, 'modDMG')
  protected modDMGConv = offenderAccessor(this.store, 'modDMGConv')
  protected armorPenetration = offenderAccessor(this.store, 'armorPenetration')

}
