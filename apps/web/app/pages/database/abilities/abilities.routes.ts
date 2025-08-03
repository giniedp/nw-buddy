import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./abilities-page.component').then((it) => it.AbilitiesPageComponent),
    children: [
      {
        path: ':id',
        loadComponent: () => import('./abilities-detail-page.component').then((it) => it.AbilitiesDetailPageComponent),
      },
    ],
  },
]
