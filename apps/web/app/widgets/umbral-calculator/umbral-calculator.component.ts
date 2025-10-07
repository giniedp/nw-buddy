import { Component } from '@angular/core'
import { UmbralCalculatorDirective } from './umbral-calculator.directive'
import { UmbralCalculatorStore } from './umbral-calculator.store'
import { UmbralSlotsComponent } from './umbral-slots.component'
import { UmbralUpgradesComponent } from './umbral-upgrades.component'

@Component({
  selector: 'nwb-umbral-calculator',
  templateUrl: './umbral-calculator.component.html',
  providers: [UmbralCalculatorStore],
  imports: [UmbralSlotsComponent, UmbralUpgradesComponent],
  hostDirectives: [UmbralCalculatorDirective],
})
export class UmbralCalculatorComponent {}
