import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { StandingTableComponent } from './standing-table.component'
import { StandingChartComponent } from './standing-chart.component'
import { ChartModule } from '~/ui/chart'
import { NwModule } from '~/nw'
import { StandingInputComponent } from './standing-input.component'
import { FormsModule } from '@angular/forms'

@NgModule({
  declarations: [StandingTableComponent, StandingChartComponent, StandingInputComponent],
  imports: [CommonModule, ChartModule, NwModule, FormsModule],
  exports: [StandingTableComponent, StandingChartComponent, StandingInputComponent],
})
export class StandingTableModule {}
