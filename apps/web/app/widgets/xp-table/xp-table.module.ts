import { NgModule } from '@angular/core'

import { XpChartPerLevelComponent } from './xp-chart-per-level.component'
import { XpChartTotalComponent } from './xp-chart-total.component'
import { XpLevelInfoComponent } from './xp-level-info.component'
import { XpTableComponent } from './xp-table.component'
import { XpUnlockLineComponent } from './xp-unlock-line.component'

const COMPONENTS = [
  XpLevelInfoComponent,
  XpTableComponent,
  XpChartPerLevelComponent,
  XpChartTotalComponent,
  XpUnlockLineComponent,
]
@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class XpTableModule {
  //
}
