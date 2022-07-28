import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { LevelComponent } from './level.component'
import { ProgressionComponent } from './progression.component'
import { StandingComponent } from './standing.component'
import { TradeComponent } from './trade.component'
import { UmbralComponent } from './umbral.component'

const routes: Routes = [
  {
    path: '',
    component: ProgressionComponent,

    children: [
      {
        path: '',
        redirectTo: 'tradeskills',
        pathMatch: 'full'
      },
      {
        path: 'tradeskills',
        component: TradeComponent,
      },
      {
        path: 'standing',
        component: StandingComponent,
      },
      {
        path: 'level',
        component: LevelComponent,
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
