import { NgModule } from '@angular/core'

import { RouterModule, Routes } from '@angular/router'
import { GameModeDetailComponent } from './game-mode-detail.component'
import { GameModesPageComponent } from './game-modes-page.component'

export const ROUTES: Routes = [
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
