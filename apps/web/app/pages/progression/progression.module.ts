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

@NgModule({
  declarations: [ProgressionComponent, UmbralComponent, TradeComponent],
  imports: [CommonModule, ProgressionRoutingModule, RouterModule, UmbralshardsModule, XpTableModule, TradeskillsModule],
})
export class ProgressionModule {}
