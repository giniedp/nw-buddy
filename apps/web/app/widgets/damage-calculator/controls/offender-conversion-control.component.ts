import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Injector, computed, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { patchState } from '@ngrx/signals'
import { AttributeRef, patchPrecision } from '@nw-data/common'
import { DamageType } from '@nw-data/generated'
import { filter, switchMap } from 'rxjs'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { damageTypeIcon } from '~/nw/weapon-types'
import { DataViewPicker } from '~/ui/data/data-view'
import { IconsModule } from '~/ui/icons'
import { svgEllipsisVertical, svgInfo } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { PerkTableAdapter } from '~/widgets/data/perk-table'
import { DamageCalculatorStore, offenderAccessor } from '../damage-calculator.store'
import { PrecisionInputComponent } from './precision-input.component'

@Component({
  selector: 'nwb-offender-conversion-control',
  templateUrl: './offender-conversion-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, IconsModule, LayoutModule, TooltipModule, PrecisionInputComponent],
  host: {
    class: 'fieldset',
  },
})
export class OffenderConversionControlComponent {
  private injector = inject(Injector)
  private db = injectNwData()

  protected store = inject(DamageCalculatorStore)
  protected iconMore = svgEllipsisVertical
  protected iconInfo = svgInfo
  protected affixType = offenderAccessor(this.store, 'affixDamageType')
  protected affixId = offenderAccessor(this.store, 'affixId')
  protected affixPercent = offenderAccessor(this.store, 'affixPercent')
  protected get isBound() {
    return this.store.offender.isBound()
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
      const scaling = this.store.offender.affixScaling()?.[it] || 0
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
    return this.store.offenderAffixScalingSum()
  }
  protected get scalingIsHigher() {
    return this.store.offenderAffixScalingSum() > this.store.offenderWeaponScalingSum()
  }

  protected damageTypeOptions = computed(() => {
    const options: Array<{ icon: string; label: string; value: DamageType }> = [
      { icon: null, label: 'None', value: null },
    ]
    const types: DamageType[] = [
      'Arcane',
      'Corruption',
      'Fire',
      'Ice',
      'Lightning',
      'Nature',
      'Slash',
      'Standard',
      'Strike',
      'Thrust',
      // 'Void',
    ]
    for (const type of types) {
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
          affixDamageType: value,
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
      .pipe(switchMap((it) => this.db.perksById(it[0])))
      .subscribe((perk) => {
        this.affixId.value = perk?.Affix || null
      })
  }
}

function scalingAccessor(store: DamageCalculatorStore, key: AttributeRef) {
  const scale = 100_00
  return {
    get value(): number {
      return patchPrecision(scale * (store.offender.affixScaling()?.[key] || 0), 2)
    },
    set value(value: number) {
      patchState(store, (state) => {
        return {
          ...state,
          offender: {
            ...state.offender,
            affixScaling: {
              ...state.offender.affixScaling,
              [key]: value / scale,
            },
          },
        }
      })
    },
  }
}
