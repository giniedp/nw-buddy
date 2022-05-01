import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { NwModule } from '~/core/nw'
import { ChartModule } from '~/ui/chart'
import { FormsModule } from '@angular/forms'
import { TradeskillInputComponent } from './tradeskill-input.component';
import { TradeskillChartComponent } from './tradeskill-chart.component'
import { NwTradeskillCircleComponent } from './tradeskill-progress.component'

@NgModule({
  imports: [CommonModule, NwModule, ChartModule, FormsModule],
  declarations: [TradeskillInputComponent, TradeskillChartComponent, NwTradeskillCircleComponent],
  exports: [TradeskillInputComponent, TradeskillChartComponent, NwTradeskillCircleComponent],
})
export class TradeskillsModule {}
