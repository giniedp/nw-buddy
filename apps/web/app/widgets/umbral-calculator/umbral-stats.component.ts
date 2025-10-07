import { Component, inject } from '@angular/core'
import { UmbralCalculatorStore } from './umbral-calculator.store'
import { IconsModule } from '~/ui/icons'

@Component({
  selector: 'nwb-umbral-stats',
  templateUrl: './umbral-stats.component.html',
  host: {
    class: 'stats'
  },
  imports: [IconsModule]
})
export class UmbralStatsComponent {
  protected store = inject(UmbralCalculatorStore)

}
