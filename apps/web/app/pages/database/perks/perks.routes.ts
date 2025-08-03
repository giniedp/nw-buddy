import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./perks-page.component').then((it) => it.PerksPageComponent),
    children: [
      {
        path: ':id',
        loadComponent: () => import('./perks-detail-page.component').then((it) => it.PerksDetailPageComponent),
      },
    ],
  },
]
