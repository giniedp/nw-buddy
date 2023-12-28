import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { PvpRankDetailPageComponent } from './pvp-rank-detail-page.component'
import { PvpRanksPageComponent } from './pvp-ranks-page.component'

const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'table',
  },
  {
    path: ':category',
    component: PvpRanksPageComponent,
    children: [
      {
        path: ':id',
        component: PvpRankDetailPageComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  declarations: [],
})
export class PvpRanksPageModule {}
