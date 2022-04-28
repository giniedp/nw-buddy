import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { UmbralTableComponent, UmbralshardsModule } from '~/widgets/umbralshards'
import { XpTableComponent, XpTableModule } from '~/widgets/xp-table'
import { ProgressionComponent } from './progression.component'
import { TradeComponent } from './trade.component'
import { UmbralComponent } from './umbral.component'

const routes: Routes = [
  {
    path: '',
    component: ProgressionComponent,
    children: [
      {
        path: 'tradeskills',
        component: TradeComponent,
      },
      {
        path: 'standing',
      },
      {
        path: 'level',
        component: XpTableComponent,
      },
      {
        path: 'umbral',
        component: UmbralComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProgressionRoutingModule {}
