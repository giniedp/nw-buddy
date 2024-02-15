import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { NwDataService } from '~/data'
import { NwModule } from '~/nw'
import { NW_WEAPON_TYPES } from '~/nw/weapon-types'
import { humanize, selectSignal } from '~/utils'
import { DamageCalculatorStore, offenderAccessor } from '../damage-calculator.store'
import { FormsModule } from '@angular/forms'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { IconsModule } from '~/ui/icons'
import { svgInfo } from '~/ui/icons/svg'

@Component({
  standalone: true,
  selector: 'nwb-offender-attack-control',
  templateUrl: './offender-attack-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, LayoutModule, TooltipModule, IconsModule],
  host: {
    class: 'form-control',
  },
})
export class OffenderAttackControlComponent {
  private data = inject(NwDataService)
  protected store = inject(DamageCalculatorStore)
  protected damageRow = offenderAccessor(this.store, 'damageRow')
  protected damageCoef = offenderAccessor(this.store, 'damageCoef', { precision: 6 })
  protected damageAdd = offenderAccessor(this.store, 'damageAdd')
  protected iconInfo = svgInfo
  protected attackOptions = selectSignal(
    {
      weaponTag: this.store.offender.weaponTag,
      tables: this.data.damageTables0,
    },
    ({ weaponTag, tables }) => {
      if (!weaponTag || !tables) {
        return []
      }
      const prefix = NW_WEAPON_TYPES.find((it) => it.WeaponTag === this.store.offender.weaponTag())?.DamageTablePrefix
      if (!prefix) {
        return []
      }
      return tables
        .filter((it) => it.DamageID.toLowerCase().startsWith(prefix.toLowerCase()))
        .map((it) => {
          return {
            label: humanize(it.DamageID.replace(prefix, '')),
            value: it.DamageID,
          }
        })
    },
  )
}
