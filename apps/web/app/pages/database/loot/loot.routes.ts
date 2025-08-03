import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./loot-page.component').then((it) => it.LootPageComponent),
    children: [
      {
        path: ':id',
        loadComponent: () => import('./loot-detail-page.component').then((it) => it.LootDetailPageComponent),
      },
    ],
  },
]
