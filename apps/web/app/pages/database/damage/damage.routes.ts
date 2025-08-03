import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./damage-page.component').then((it) => it.DamagePageComponent),
    children: [
      {
        path: ':id',
        loadComponent: () => import('./damage-detail-page.component').then((it) => it.DamageDetailPageComponent),
      },
    ],
  },
]
