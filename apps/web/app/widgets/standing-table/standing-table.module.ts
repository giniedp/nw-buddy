import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NwModule } from '~/nw'
import { ChartModule } from '~/ui/chart'
import { StandingChartComponent } from './standing-chart.component'
import { StandingInputComponent } from './standing-input.component'
import { StandingNotesComponent } from './standing-notes.component'
import { StandingTableComponent } from './standing-table.component'

@NgModule({
  declarations: [StandingTableComponent, StandingChartComponent, StandingInputComponent, StandingNotesComponent],
  imports: [CommonModule, ChartModule, NwModule, FormsModule],
  exports: [StandingTableComponent, StandingChartComponent, StandingInputComponent, StandingNotesComponent],
})
export class StandingTableModule {}
