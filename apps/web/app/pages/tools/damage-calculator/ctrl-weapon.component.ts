import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Injector, computed, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { patchState } from '@ngrx/signals'
import { AttributeRef, NW_MAX_GEAR_SCORE, patchPrecision } from '@nw-data/common'
import { NwDataService } from '~/data'
import { NwModule } from '~/nw'
import { NW_WEAPON_TYPES } from '~/nw/weapon-types'
import { IconsModule } from '~/ui/icons'
import { svgEllipsisVertical } from '~/ui/icons/svg'
import { InputSliderComponent } from '~/ui/input-slider'
import { LayoutModule } from '~/ui/layout'
import { DamageCalculatorStore, OffenderState } from './damage-calculator.store'

@Component({
  standalone: true,
  selector: 'nwb-ctrl-weapon',
  templateUrl: './ctrl-weapon.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, InputSliderComponent, IconsModule, LayoutModule],
  host: {
    class: 'form-control',
  },
})
export class CtrlWeaponCompontnt {
  private data = inject(NwDataService)
  private injector = inject(Injector)
  protected store = inject(DamageCalculatorStore)
  protected iconMore = svgEllipsisVertical

  protected weaponTag = offenderAccessor(this.store, 'weaponTag')
  protected weaponDamage = offenderAccessor(this.store, 'weaponDamage')
  protected damageType = offenderAccessor(this.store, 'weaponDamageType')
  protected damageTypeIcon = this.store.offenderWeaponDamageTypeIcon
  protected gearScore = offenderAccessor(this.store, 'weaponGearScore')
  protected get gearScoreFactor() {
    return this.store.offenderWeaponGearScoreFactor()
  }
  protected scaling = [
    { label: 'STR', access: scalingAccessor(this.store, 'str') },
    { label: 'DEX', access: scalingAccessor(this.store, 'dex') },
    { label: 'INT', access: scalingAccessor(this.store, 'int') },
    { label: 'FOC', access: scalingAccessor(this.store, 'foc') },
  ]
  protected get scalingSum() {
    return this.store.offenderWeaponScalingSum()
  }
  protected get scalingIsHigher() {
    return this.store.offenderWeaponScalingSum() > this.store.offenderConvertScalingSum()
  }
  protected weapon = computed(() => {
    const tag = this.weaponTag.value
    const found = NW_WEAPON_TYPES.find((it) => it.WeaponTag === tag)
    if (found) {
      return {
        name: found.UIName,
        icon: found.IconPath,
      }
    }
    return null
  })
  protected gsMin = 0
  protected gsMax = NW_MAX_GEAR_SCORE
  protected weaponOptions = computed(() => {
    return NW_WEAPON_TYPES.map((it) => {
      return {
        icon: it.IconPath,
        label: it.UIName,
        value: it.WeaponTag,
      }
    })
  })
}

function offenderAccessor<K extends keyof OffenderState>(store: DamageCalculatorStore, key: K) {
  return {
    get value(): OffenderState[K] {
      return store.offender()?.[key] as OffenderState[K]
    },
    set value(value: OffenderState[K]) {
      patchState(store, (state) => {
        return {
          ...state,
          offender: {
            ...state.offender,
            [key]: value,
          },
        }
      })
    },
  }
}

function scalingAccessor(store: DamageCalculatorStore, key: AttributeRef) {
  const scale = 100_00
  return {
    get value(): number {
      return patchPrecision(scale * (store.offender.weaponScaling()?.[key] || 0), 2)
    },
    set value(value: number) {
      patchState(store, (state) => {
        return {
          ...state,
          offender: {
            ...state.offender,
            weaponScaling: {
              ...state.offender.weaponScaling,
              [key]: value / scale,
            },
          },
        }
      })
    },
  }
}
