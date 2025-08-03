import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pvp-ranks-page.component').then((it) => it.PvpRanksPageComponent),
    children: [
      {
        path: ':id',
        loadComponent: () => import('./pvp-rank-detail-page.component').then((it) => it.PvpRankDetailPageComponent),
      },
    ],
  },
]
