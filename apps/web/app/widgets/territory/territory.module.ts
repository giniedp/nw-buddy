import { NgModule } from '@angular/core'
import { TerritoryCardCoponent } from './territory-card.component'
import { TerritoryGovernanceTableComponent } from './territory-governance-table.component'
import { TerritoryStandingChartComponent } from './territory-standing-chart.component'
import { TerritoryStandingTableComponent } from './territory-standing-table.component'

const COMPONENTS = [
  TerritoryCardCoponent,
  TerritoryStandingChartComponent,
  TerritoryStandingTableComponent,
  TerritoryGovernanceTableComponent,
]
@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class TerritoryModule {}
