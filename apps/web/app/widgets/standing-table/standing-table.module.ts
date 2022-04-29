import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { StandingTableComponent } from './standing-table.component'
import { StandingChartComponent } from './standing-chart.component'
import { ChartModule } from '~/ui/chart'
import { NwModule } from '~/core/nw'

@NgModule({
  declarations: [StandingTableComponent, StandingChartComponent],
  imports: [CommonModule, ChartModule, NwModule],
  exports: [StandingTableComponent, StandingChartComponent],
})
export class StandingTableModule {}
