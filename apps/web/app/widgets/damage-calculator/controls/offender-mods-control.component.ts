import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgInfo } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { DamageCalculatorStore, offenderAccessor } from '../damage-calculator.store'
import { StackedValueControlComponent } from './stacked-value-control.component'

@Component({
  selector: 'nwb-offender-mods-control',
  templateUrl: './offender-mods-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    StackedValueControlComponent,
    FormsModule,
    LayoutModule,
    TooltipModule,
    IconsModule,
  ],
  host: {
    class: 'fieldset',
  },
})
export class OffenderModsControlComponent {
  protected store = inject(DamageCalculatorStore)

  protected modPvP = offenderAccessor(this.store, 'modPvP')
  protected modAmmo = offenderAccessor(this.store, 'modAmmo')
  protected modCrit = offenderAccessor(this.store, 'modCrit')
  protected modBase = offenderAccessor(this.store, 'modBase')
  protected modBaseDot = offenderAccessor(this.store, 'modBaseDot')
  protected modBaseAffix = offenderAccessor(this.store, 'modBaseAffix')
  protected modDMG = offenderAccessor(this.store, 'modDMG')
  protected modDMGDot = offenderAccessor(this.store, 'modDMGDot')
  protected modDMGAffix = offenderAccessor(this.store, 'modDMGAffix')
  protected armorPenetration = offenderAccessor(this.store, 'armorPenetration')

  protected iconInfo = svgInfo
}
