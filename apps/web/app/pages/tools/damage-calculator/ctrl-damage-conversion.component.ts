import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy, inject, computed, Injector } from '@angular/core'
import { NwModule } from '~/nw'
import { DamageCalculatorStore, OffenderState } from './damage-calculator.store'
import { InputSliderComponent } from '~/ui/input-slider'
import { IconsModule } from '~/ui/icons'
import { LayoutModule } from '~/ui/layout'
import { DamageType } from '@nw-data/generated'
import { NW_WEAPON_TYPES, damageTypeIcon } from '~/nw/weapon-types'
import { uniq } from 'lodash'
import { humanize } from '~/utils'
import { patchState } from '@ngrx/signals'
import { FormsModule } from '@angular/forms'
import { AttributeRef, patchPrecision } from '@nw-data/common'
import { svgEllipsisVertical } from '~/ui/icons/svg'
import { DataViewPicker } from '~/ui/data/data-view'
import { PerkTableAdapter } from '~/widgets/data/perk-table'
import { filter, switchMap } from 'rxjs'
import { NwDataService } from '~/data'

@Component({
  standalone: true,
  selector: 'nwb-ctrl-damage-conversion',
  templateUrl: './ctrl-damage-conversion.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, InputSliderComponent, IconsModule, LayoutModule],
  host: {
    class: 'form-control',
  },
})
export class CtrlDamageConversionComponent {

  private injector = inject(Injector)
  private data = inject(NwDataService)

  protected store = inject(DamageCalculatorStore)
  protected iconMore = svgEllipsisVertical
  protected convertType = accessor(this.store, 'convertDamageType')
  protected convertPercent = numAccessor(this.store, 'convertPercent', 100)
  protected convertAffix = accessor(this.store, 'convertAffix')
  protected scaling = [
    { label: 'STR', access: scalingAccessor(this.store, 'str') },
    { label: 'DEX', access: scalingAccessor(this.store, 'dex') },
    { label: 'INT', access: scalingAccessor(this.store, 'int') },
    { label: 'FOC', access: scalingAccessor(this.store, 'foc') },
  ]
  protected get scalingSum() {
    return this.store.offenderConvertScalingSum()
  }
  protected get scalingIsHigher() {
    return this.store.offenderConvertScalingSum() > this.store.offenderWeaponScalingSum()
  }

  protected damageTypeOptions = computed(() => {
    const options: Array<{ icon: string, label: string, value: DamageType }> = [
      { icon: null, label: 'None', value: null },
    ]
    for (const type of uniq(NW_WEAPON_TYPES.map((it) => it.DamageType)) ) {
      options.push({
        icon: damageTypeIcon(type),
        label: type,
        value: type,
      })
    }
    return options
  })

  protected submitDamageType(value: string) {
    patchState(this.store, (state) => {
      return {
        ...state,
        offender: {
          ...state.offender,
          convertDamageType: value
        }
      }
    })
  }

  protected pickAffix() {
    DataViewPicker.from({
      injector: this.injector,
      title: 'Choose Perk',
      selection: null,
      displayMode: ['grid'],
      dataView: {
        adapter: PerkTableAdapter,
        filter: (it) => {
          return !!it.$affix?.PreferHigherScaling
        }
      },
    })
    .pipe(filter((it) => !!it))
    .pipe(switchMap((it) => this.data.perk(it[0])))
    .subscribe((perk) => {
      this.convertAffix.value = perk?.Affix || null
    })
  }
}

function accessor<K extends keyof OffenderState>(store: DamageCalculatorStore, key: K) {
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
            [key]: value
          }
        }
      })
    }
  }
}

function numAccessor<K extends keyof OffenderState>(store: DamageCalculatorStore, key: K, scale = 1) {
  return {
    get value(): number {
      return store.offender()?.[key] as number * scale
    },
    set value(value: number) {
      patchState(store, (state) => {
        return {
          ...state,
          offender: {
            ...state.offender,
            [key]: (value / scale) as any
          }
        }
      })
    }
  }
}

function scalingAccessor(store: DamageCalculatorStore, key: AttributeRef) {
  const scale = 100_00
  return {
    get value(): number {
      return patchPrecision(scale * (store.offender.convertScaling()?.[key] || 0), 2)
    },
    set value(value: number) {
      patchState(store, (state) => {
        return {
          ...state,
          offender: {
            ...state.offender,
            convertScaling: {
              ...state.offender.convertScaling,
              [key]: value / scale
            }
          }
        }
      })
    }
  }
}
