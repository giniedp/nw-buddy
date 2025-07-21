import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NwModule } from '~/nw'
import { StackedValueControlComponent } from './stacked-value-control.component'
import { DamageCalculatorStore, defenderAccessor } from '../damage-calculator.store'
import { TooltipModule } from '~/ui/tooltip'
import { IconsModule } from '~/ui/icons'
import { svgInfo } from '~/ui/icons/svg'

@Component({
  selector: 'nwb-defender-mods-control',
  templateUrl: './defender-mods-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, StackedValueControlComponent, TooltipModule, IconsModule],
  host: {
    class: 'fieldset',
  },
})
export class DefenderModsControlComponent {
  protected store = inject(DamageCalculatorStore)
  protected iconInfo = svgInfo

  protected modABS = defenderAccessor(this.store, 'modABS')
  protected modABSAffix = defenderAccessor(this.store, 'modABSAffix')
  protected modABSDot = defenderAccessor(this.store, 'modABSDot')
  protected modWKN = defenderAccessor(this.store, 'modWKN')
  protected modWKNAffix = defenderAccessor(this.store, 'modWKNAffix')
  protected modWKNDot = defenderAccessor(this.store, 'modWKNDot')
  protected modBaseReduction = defenderAccessor(this.store, 'modBaseReduction')
  protected modBaseReductionAffix = defenderAccessor(this.store, 'modBaseReductionAffix')
  protected modBaseReductionDot = defenderAccessor(this.store, 'modBaseReductionDot')
  protected modCritReduction = defenderAccessor(this.store, 'modCritReduction')

  protected get isBound() {
    return this.store.defender.isBound()
  }
  protected get lockAbsPreset() {
    return !!this.store.defenderVitalId()
  }
  protected get lockWknPreset() {
    return !!this.store.defenderVitalId()
  }
}
