import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./loot-limits-page.component').then((it) => it.LootLimitsPageComponent),
    children: [
      {
        path: ':id',
        loadComponent: () => import('./loot-limit-detail-page.component').then((it) => it.LootLimitDetailPageComponent),
      },
    ],
  },
]
