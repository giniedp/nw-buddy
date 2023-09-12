import { NgModule } from '@angular/core'

import { RouterModule, Routes } from '@angular/router'
import { GameModeDetailComponent } from './game-mode-detail.component'
import { GameModesPageComponent } from './game-modes-page.component'

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'expeditions',
  },
  {
    path: ':category',
    component: GameModesPageComponent,
    children: [
      {
        path: ':id',
        component: GameModeDetailComponent,
      },
    ],
  },
]
@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class GameModesModule {}
