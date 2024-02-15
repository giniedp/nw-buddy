import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { patchState } from '@ngrx/signals'
import {
  AttributeRef,
  NW_MAX_CHARACTER_LEVEL,
  NW_MAX_GEAR_SCORE,
  NW_MAX_POINTS_PER_ATTRIBUTE,
  NW_MIN_POINTS_PER_ATTRIBUTE,
  patchPrecision,
} from '@nw-data/common'
import { NwModule } from '~/nw'
import { InputSliderComponent } from '~/ui/input-slider'
import { LayoutModule } from '~/ui/layout'
import { DamageCalculatorStore, offenderAccessor } from '../damage-calculator.store'
import { svgInfo } from '~/ui/icons/svg'
import { IconsModule } from '~/ui/icons'
import { TooltipModule } from '~/ui/tooltip'

@Component({
  standalone: true,
  selector: 'nwb-offender-stats-control',
  templateUrl: './offender-stats-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, InputSliderComponent, IconsModule, LayoutModule, TooltipModule],
  host: {
    class: 'form-control',
  },
})
export class OffenderStatsControlComponent {
  protected store = inject(DamageCalculatorStore)

  protected level = offenderAccessor(this.store, 'level')
  protected gearScore = offenderAccessor(this.store, 'gearScore')
  protected attrPoints = [
    { label: 'STR', access: attributeAccessor(this.store, 'str') },
    { label: 'DEX', access: attributeAccessor(this.store, 'dex') },
    { label: 'INT', access: attributeAccessor(this.store, 'int') },
    { label: 'FOC', access: attributeAccessor(this.store, 'foc') },
  ]
  protected attrLevels = [
    { label: 'STR', access: attributeSumsAccessor(this.store, 'str') },
    { label: 'DEX', access: attributeSumsAccessor(this.store, 'dex') },
    { label: 'INT', access: attributeSumsAccessor(this.store, 'int') },
    { label: 'FOC', access: attributeSumsAccessor(this.store, 'foc') },
  ]

  protected levelMin = 1
  protected levelMax = NW_MAX_CHARACTER_LEVEL

  protected gsMin = 0
  protected gsMax = NW_MAX_GEAR_SCORE

  protected attrMin = NW_MIN_POINTS_PER_ATTRIBUTE
  protected attrMax = NW_MAX_POINTS_PER_ATTRIBUTE

  protected iconInfo = svgInfo
}

function attributeAccessor(store: DamageCalculatorStore, key: AttributeRef) {
  return {
    get value(): number {
      return store.offender.attributePoints()?.[key] || 0
    },
    set value(value: number) {
      patchState(store, (state) => {
        return {
          ...state,
          offender: {
            ...state.offender,
            attributePoints: {
              ...state.offender.attributePoints,
              [key]: value,
            },
          },
        }
      })
    },
  }
}

function attributeSumsAccessor(store: DamageCalculatorStore, key: AttributeRef) {
  return {
    get value(): number {
      return patchPrecision(store.offender.attributeModSums()?.[key] || 0, 3)
    },
    set value(value: number) {
      patchState(store, (state) => {
        return {
          ...state,
          offender: {
            ...state.offender,
            attributeModSums: {
              ...state.offender.attributeModSums,
              [key]: value,
            },
          },
        }
      })
    },
  }
}
