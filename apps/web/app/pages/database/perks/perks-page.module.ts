import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { PerksDetailPageComponent } from './perks-detail-page.component'
import { PerksPageComponent } from './perks-page.component'

const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'table',
  },
  {
    path: ':category',
    component: PerksPageComponent,
    children: [
      {
        path: ':id',
        component: PerksDetailPageComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  declarations: [],
})
export class PerksPageModule {}
