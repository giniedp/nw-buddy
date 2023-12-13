import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { PlayerTitleDetailPageComponent } from './player-title-detail-page.component'
import { PlayerTitlesPageComponent } from './player-titles-page.component'

const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'table',
  },
  {
    path: ':category',
    component: PlayerTitlesPageComponent,
    children: [
      {
        path: ':id',
        component: PlayerTitleDetailPageComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  declarations: [],
})
export class PlayerTitlesPageModule {}
