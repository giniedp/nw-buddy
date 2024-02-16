import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Injector, computed, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { patchState } from '@ngrx/signals'
import { AttributeRef, patchPrecision } from '@nw-data/common'
import { DamageType } from '@nw-data/generated'
import { uniq } from 'lodash'
import { filter, switchMap } from 'rxjs'
import { NwDataService } from '~/data'
import { NwModule } from '~/nw'
import { NW_WEAPON_TYPES, damageTypeIcon } from '~/nw/weapon-types'
import { DataViewPicker } from '~/ui/data/data-view'
import { IconsModule } from '~/ui/icons'
import { svgEllipsisVertical, svgInfo } from '~/ui/icons/svg'
import { InputSliderComponent } from '~/ui/input-slider'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { PerkTableAdapter } from '~/widgets/data/perk-table'
import { DamageCalculatorStore, offenderAccessor } from '../damage-calculator.store'
import { StackedValueControlComponent } from './stacked-value-control.component'
import { PrecisionInputComponent } from './precision-input.component'

@Component({
  standalone: true,
  selector: 'nwb-offender-conversion-control',
  templateUrl: './offender-conversion-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, InputSliderComponent, IconsModule, LayoutModule, TooltipModule, PrecisionInputComponent],
  host: {
    class: 'form-control',
  },
})
export class OffenderConversionControlComponent {
  private injector = inject(Injector)
  private data = inject(NwDataService)

  protected store = inject(DamageCalculatorStore)
  protected iconMore = svgEllipsisVertical
  protected iconInfo = svgInfo
  protected convertType = offenderAccessor(this.store, 'convertDamageType')
  protected convertAffix = offenderAccessor(this.store, 'convertAffix')
  protected convertPercent = offenderAccessor(this.store, 'convertPercent')
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
      const scaling = this.store.offender.convertScaling()?.[it] || 0
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
    return this.store.offenderConvertScalingSum()
  }
  protected get scalingIsHigher() {
    return this.store.offenderConvertScalingSum() > this.store.offenderWeaponScalingSum()
  }

  protected damageTypeOptions = computed(() => {
    const options: Array<{ icon: string; label: string; value: DamageType }> = [
      { icon: null, label: 'None', value: null },
    ]
    for (const type of uniq(NW_WEAPON_TYPES.map((it) => it.DamageType))) {
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
          convertDamageType: value,
        },
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
        },
      },
    })
      .pipe(filter((it) => !!it))
      .pipe(switchMap((it) => this.data.perk(it[0])))
      .subscribe((perk) => {
        this.convertAffix.value = perk?.Affix || null
      })
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
              [key]: value / scale,
            },
          },
        }
      })
    },
  }
}
