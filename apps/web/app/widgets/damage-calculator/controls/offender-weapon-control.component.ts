import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { patchState } from '@ngrx/signals'
import { AttributeRef, NW_MAX_GEAR_SCORE, patchPrecision } from '@nw-data/common'
import { NwModule } from '~/nw'
import { NW_WEAPON_TYPES } from '~/nw/weapon-types'
import { IconsModule } from '~/ui/icons'
import { svgEllipsisVertical, svgInfo } from '~/ui/icons/svg'
import { InputSliderComponent } from '~/ui/input-slider'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { DamageCalculatorStore, OffenderState } from '../damage-calculator.store'
import { PrecisionInputComponent } from './precision-input.component'

@Component({
  selector: 'nwb-offender-weapon-control',
  templateUrl: './offender-weapon-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    FormsModule,
    InputSliderComponent,
    IconsModule,
    LayoutModule,
    TooltipModule,
    PrecisionInputComponent,
  ],
  host: {
    class: 'fieldset',
  },
})
export class OffenderWeaponControlComponent {
  protected store = inject(DamageCalculatorStore)
  protected iconMore = svgEllipsisVertical
  protected iconInfo = svgInfo

  protected weaponTag = offenderAccessor(this.store, 'weaponTag')
  protected weaponDamage = offenderAccessor(this.store, 'weaponDamage')
  protected damageType = offenderAccessor(this.store, 'weaponDamageType')
  protected damageTypeIcon = this.store.offenderWeaponDamageTypeIcon
  protected gearScore = offenderAccessor(this.store, 'weaponGearScore')
  protected get gearScoreFactor() {
    return this.store.offenderWeaponGearScoreFactor()
  }
  protected get hasWeaponTag() {
    return !!this.weaponTag.value
  }
  protected get isBound() {
    return !!this.store.offender.isBound()
  }
  private refs: AttributeRef[] = ['str', 'dex', 'int', 'foc']
  protected scaling = this.refs.map((it) => {
    return {
      label: it.toUpperCase(),
      access: scalingAccessor(this.store, it),
    }
  })
  protected get scalingInfos() {
    return this.refs.map((it) => {
      const stat = this.store.offender.attributeModSums[it]()
      const scaling = this.store.offender.weaponScaling()?.[it] || 0
      const value = stat * scaling
      return {
        label: it.toUpperCase(),
        stat: stat,
        scaling: scaling,
        value: value,
      }
    })
  }

  protected get scalingSum() {
    return this.store.offenderWeaponScalingSum()
  }
  protected get scalingIsHigher() {
    return this.store.offenderWeaponScalingSum() > this.store.offenderAffixScalingSum()
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
