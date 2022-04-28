import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { NwModule } from '~/core/nw'
import { ChartModule } from '~/ui/chart'
import { FormsModule } from '@angular/forms'
import { TradeskillInputComponent } from './tradeskill-input.component';
import { TradeskillChartComponent } from './tradeskill-chart.component'

@NgModule({
  declarations: [TradeskillInputComponent, TradeskillChartComponent],
  imports: [CommonModule, NwModule, ChartModule, FormsModule],
  exports: [TradeskillInputComponent, TradeskillChartComponent],
})
export class TradeskillsModule {}
