import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NwDataService } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgInfo } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { selectSignal } from '~/utils'
import { DamageCalculatorStore, offenderAccessor } from '../damage-calculator.store'
import { StackedValueControlComponent } from './stacked-value-control.component'

@Component({
  standalone: true,
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
    class: 'block',
  },
})
export class OffenderModsControlComponent {
  protected store = inject(DamageCalculatorStore)
  private data = inject(NwDataService)
  protected balanceMods = selectSignal(this.data.pvpBalance, (rows) => {
    if (!rows?.length) {
      return []
    }
    return rows
      .filter((it) => it.WeaponBaseDamageAdjustment)
      .map((it) => {
        return {
          mode: it.$source,
          weapon: it.BalanceTarget,
          value: it.WeaponBaseDamageAdjustment,
        }
      })
  })

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
