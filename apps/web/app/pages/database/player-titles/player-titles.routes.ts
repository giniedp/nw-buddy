import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./player-titles-page.component').then((it) => it.PlayerTitlesPageComponent),
    children: [
      {
        path: ':id',
        loadComponent: () =>
          import('./player-title-detail-page.component').then((it) => it.PlayerTitleDetailPageComponent),
      },
    ],
  },
]
