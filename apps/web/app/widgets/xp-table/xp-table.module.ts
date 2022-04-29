import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'

import { XpTableComponent } from './xp-table.component';
import { XpChartComponent } from './xp-chart.component'
import { ChartModule } from '~/ui/chart';

@NgModule({
  imports: [CommonModule, ChartModule],
  declarations: [XpTableComponent, XpChartComponent],
  exports: [XpTableComponent, XpChartComponent],
})
export class XpTableModule {}
