import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'

import { ChartModule } from '~/ui/chart'
import { XpChartComponent } from './xp-chart.component'
import { XpLevelInfoComponent } from './xp-level-info.component'
import { XpTableComponent } from './xp-table.component'

const COMPONENTS = [XpLevelInfoComponent]
@NgModule({
  imports: [CommonModule, ChartModule, ...COMPONENTS],
  declarations: [XpTableComponent, XpChartComponent],
  exports: [XpTableComponent, XpChartComponent, ...COMPONENTS],
})
export class XpTableModule {}
