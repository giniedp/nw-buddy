import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { SeasonPassPageComponent } from './season-pass-page.component'
import { EmptyComponent } from '~/widgets/empty'
import { SeasonPassDetailPageComponent } from './season-pass-detail-page.component'

const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'table',
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
