import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { patchState } from '@ngrx/signals'
import {
  AttributeRef,
  NW_MAX_CHARACTER_LEVEL,
  NW_MAX_GEAR_SCORE,
  NW_MAX_POINTS_PER_ATTRIBUTE,
  NW_MIN_POINTS_PER_ATTRIBUTE,
  getPvPScaling,
  patchPrecision,
} from '@nw-data/common'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgInfo } from '~/ui/icons/svg'
import { InputSliderComponent } from '~/ui/input-slider'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { AttributesEditorComponent } from '~/widgets/attributes-editor'
import { DamageCalculatorStore, offenderAccessor } from '../damage-calculator.store'
import { PrecisionInputComponent } from './precision-input.component'
import { DamageIndicatorService } from '../damage-indicator.service'

@Component({
  selector: 'nwb-offender-stats-control',
  templateUrl: './offender-stats-control.component.html',
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
    AttributesEditorComponent,
  ],
  host: {
    class: 'fieldset',
  },
})
export class OffenderStatsControlComponent {
  protected store = inject(DamageCalculatorStore)
  protected indicator = inject(DamageIndicatorService)

  protected get isBound() {
    return !!this.store.offender.isBound()
  }
  protected level = offenderAccessor(this.store, 'level')
  protected isPvp = this.store.defenderIsPlayer
  protected pvpScale = computed(() => {
    return (
      1 +
      getPvPScaling({
        attackerLevel: this.store.offender.level(),
        defenderLevel: this.store.defender.level(),
      })
    )
  })
  protected gearScore = offenderAccessor(this.store, 'gearScore')
  protected attrs = offenderAccessor(this.store, 'attributePoints')
  protected get attrsAssigned() {
    return {
      str: Math.max(0, this.attrs.value.str - NW_MIN_POINTS_PER_ATTRIBUTE),
      dex: Math.max(0, this.attrs.value.dex - NW_MIN_POINTS_PER_ATTRIBUTE),
      int: Math.max(0, this.attrs.value.int - NW_MIN_POINTS_PER_ATTRIBUTE),
      foc: Math.max(0, this.attrs.value.foc - NW_MIN_POINTS_PER_ATTRIBUTE),
      con: Math.max(0, this.attrs.value.con - NW_MIN_POINTS_PER_ATTRIBUTE),
    }
  }
  protected set attrsAssigned(value: Record<AttributeRef, number>) {
    this.attrs.value = {
      con: value.con + NW_MIN_POINTS_PER_ATTRIBUTE,
      dex: value.dex + NW_MIN_POINTS_PER_ATTRIBUTE,
      int: value.int + NW_MIN_POINTS_PER_ATTRIBUTE,
      str: value.str + NW_MIN_POINTS_PER_ATTRIBUTE,
      foc: value.foc + NW_MIN_POINTS_PER_ATTRIBUTE,
    }
  }

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

  protected attrMin = 0
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
