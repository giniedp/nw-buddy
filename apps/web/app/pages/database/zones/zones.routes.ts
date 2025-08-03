import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./zones-page.component').then((it) => it.ZonesPageComponent),
    children: [
      {
        path: ':id',
        loadComponent: () => import('./zones-detail-page.component').then((it) => it.ZoneDetailPageComponent),
      },
    ],
  },
]
