import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { SeasonPassDetailPageComponent } from './season-pass-detail-page.component'
import { SeasonPassPageComponent } from './season-pass-page.component'

const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'season3',
  },
  {
    path: ':category',
    component: SeasonPassPageComponent,
    children: [
      {
        path: ':id',
        component: SeasonPassDetailPageComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  declarations: [],
})
export class SeasonPassPageModule {}
