import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { NwModule } from '~/nw'
import { ChartModule } from '~/ui/chart'
import { FormsModule } from '@angular/forms'
import { TradeskillInputComponent } from './tradeskill-input.component'
import { TradeskillChartComponent } from './tradeskill-chart.component'
import { NwTradeskillCircleComponent } from './tradeskill-progress.component'

const COMPONENTS = [TradeskillChartComponent, TradeskillInputComponent]
@NgModule({
  imports: [CommonModule, NwModule, ChartModule, FormsModule, ...COMPONENTS],
  declarations: [NwTradeskillCircleComponent],
  exports: [NwTradeskillCircleComponent, ...COMPONENTS],
})
export class TradeskillsModule {}
