import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'expeditions',
  },
  {
    path: ':category',
    loadComponent: () => import('./game-modes-page.component').then((it) => it.GameModesPageComponent),
    children: [
      {
        path: ':id',
        loadComponent: () => import('./game-mode-detail.component').then((it) => it.GameModeDetailComponent),
      },
    ],
  },
]
