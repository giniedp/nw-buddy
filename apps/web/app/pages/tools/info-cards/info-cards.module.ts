import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { GemsOverviewComponent } from './gems-overview.component'

import { InfoCardsComponent } from './info-cards.component'
import { RunesOverviewComponent } from './runes-overview.component'
import { TrophiesOverviewComponent } from './trophies-overview.component'
import { VitalsFamiliesComponent } from './vitals-families.component'

const routes: Routes = [
  {
    path: '',
    component: InfoCardsComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'trophies',
      },
      {
        path: 'trophies',
        component: TrophiesOverviewComponent,
      },
      {
        path: 'runes',
        component: RunesOverviewComponent,
      },
      {
        path: 'vitals',
        component: VitalsFamiliesComponent,
      },
      {
        path: 'gems',
        component: GemsOverviewComponent,
      },
    ],
  },
]
@NgModule({
  imports: [RouterModule.forChild(routes)],
  declarations: [],
})
export class InfoCardsModule {
  //
}
