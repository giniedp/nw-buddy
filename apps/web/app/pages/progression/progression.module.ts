import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { ProgressionRoutingModule } from './progression-routing.module'
import { ProgressionComponent } from './progression.component'
import { RouterModule } from '@angular/router'
import { UmbralshardsModule } from '~/widgets/umbralshards'
import { XpTableModule } from '~/widgets/xp-table'
import { UmbralComponent } from './umbral.component'
import { TradeComponent } from './trade.component'
import { TradeskillsModule } from '~/widgets/tradeskills'
import { LevelComponent } from './level.component'
import { StandingComponent } from './standing.component'
import { StandingTableModule } from '~/widgets/standing-table'

@NgModule({
  declarations: [ProgressionComponent, UmbralComponent, TradeComponent, LevelComponent, StandingComponent],
  imports: [CommonModule, ProgressionRoutingModule, RouterModule, UmbralshardsModule, XpTableModule, TradeskillsModule, StandingTableModule],
})
export class ProgressionModule {}
