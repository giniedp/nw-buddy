import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { GemsOverviewComponent } from './gems-overview.component'

import { InfoCardsComponent } from './info-cards.component'

const routes: Routes = [
  {
    path: '',
    component: InfoCardsComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'vitals',
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
