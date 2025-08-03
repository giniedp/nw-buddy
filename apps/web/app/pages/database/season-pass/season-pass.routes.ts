import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./season-pass-page.component').then((it) => it.SeasonPassPageComponent),
    children: [
      {
        path: ':id',
        loadComponent: () =>
          import('./season-pass-detail-page.component').then((it) => it.SeasonPassDetailPageComponent),
      },
    ],
  },
]
