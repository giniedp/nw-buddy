import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { PlayerTitlesPageComponent } from './player-titles-page.component'
import { EmptyComponent } from '~/widgets/empty'

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
        component: EmptyComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  declarations: [],
})
export class PlayerTitlesPageModule {}
