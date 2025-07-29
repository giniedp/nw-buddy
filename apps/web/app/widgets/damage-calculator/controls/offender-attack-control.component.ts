import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { AttackType } from '@nw-data/generated'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { NW_WEAPON_TYPES } from '~/nw/weapon-types'
import { IconsModule } from '~/ui/icons'
import { svgInfo } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { humanize, selectSignal } from '~/utils'
import { DamageCalculatorStore, offenderAccessor } from '../damage-calculator.store'
import { PrecisionInputComponent } from './precision-input.component'

@Component({
  selector: 'nwb-offender-attack-control',
  templateUrl: './offender-attack-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, LayoutModule, TooltipModule, IconsModule, PrecisionInputComponent],
  host: {
    class: 'fieldset',
  },
})
export class OffenderAttackControlComponent {
  private db = injectNwData()
  protected store = inject(DamageCalculatorStore)
  protected damageRow = offenderAccessor(this.store, 'damageRow')
  protected attackType = offenderAccessor(this.store, 'attackType')
  protected attackKind = offenderAccessor(this.store, 'attackKind')
  protected attackInfo = computed(() => {
    return attackInfo(this.attackType.value, this.attackKind.value === 'Ranged')
  })

  protected damageCoef = offenderAccessor(this.store, 'damageCoef', { precision: 6 })
  protected damageAdd = offenderAccessor(this.store, 'damageAdd')
  protected iconInfo = svgInfo
  protected get isBound() {
    return !!this.store.offender.isBound()
  }
  protected attackOptions = selectSignal(
    {
      weaponTag: this.store.offender.weaponTag,
      tables: this.db.damageTables0(),
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
            coef: it.DmgCoef,
            ...attackInfo(it.AttackType, ['1', 'true'].includes(String(it.IsRanged).toLowerCase())),
          }
        })
    },
  )

  protected onAttackSelected(value: string, info: ReturnType<typeof attackInfo>) {
    this.damageRow.value = value
    this.attackType.value = info.type as AttackType
    this.attackKind.value = info.isRanged ? 'Ranged' : 'Melee'
  }
}

function attackInfo(type: string, isRanged: boolean) {
  return {
    isRanged: isRanged,
    isHeavy: type === 'Heavy',
    isLight: type === 'Light',
    isMagic: type === 'Magic',
    isAbility: type === 'Ability',
    type: type,
  }
}
