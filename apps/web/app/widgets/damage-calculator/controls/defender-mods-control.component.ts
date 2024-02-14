import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NwModule } from '~/nw'
import { StackedValueControlComponent } from './stacked-value-control.component'
import { DamageCalculatorStore, defenderAccessor } from '../damage-calculator.store'

@Component({
  standalone: true,
  selector: 'nwb-defender-mods-control',
  templateUrl: './defender-mods-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, StackedValueControlComponent],
  host: {
    class: 'form-control',
  },
})
export class DefenderModsControlComponent {
  protected store = inject(DamageCalculatorStore)

  protected modABS = defenderAccessor(this.store, 'modABS')
  protected modABSConv = defenderAccessor(this.store, 'modABSConv')
  protected modWKN = defenderAccessor(this.store, 'modWKN')
  protected modWKNConv = defenderAccessor(this.store, 'modWKNConv')
  protected modCritReduction = defenderAccessor(this.store, 'modCritReduction')
  protected modBaseReduction = defenderAccessor(this.store, 'modBaseReduction')
  protected modBaseReductionConv = defenderAccessor(this.store, 'modBaseReductionConv')
}
