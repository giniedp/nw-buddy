import { Type } from '@angular/core'
import { UmbralCalculatorComponent } from './umbral-calculator.component'
import { UmbralCalculatorDirective } from './umbral-calculator.directive'
import { UmbralSlotsComponent } from './umbral-slots.component'
import { UmbralUpgradesComponent } from './umbral-upgrades.component'
import { UmbralStatsComponent } from './umbral-stats.component'

export const UMBRAL_MODULE: Array<Type<any>> = [
  UmbralCalculatorComponent,
  UmbralCalculatorDirective,
  UmbralSlotsComponent,
  UmbralUpgradesComponent,
  UmbralStatsComponent,
]
