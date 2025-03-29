import { NgModule } from '@angular/core'
import { TradeskillChartComponent } from './tradeskill-chart.component'
import { TradeskillInputComponent } from './tradeskill-input.component'
import { NwTradeskillCircleComponent } from './tradeskill-progress.component'

const COMPONENTS = [TradeskillChartComponent, TradeskillInputComponent, NwTradeskillCircleComponent]
@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class TradeskillsModule {}
