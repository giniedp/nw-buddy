import { Routes } from '@angular/router'
import { NW_MAP_NEWWORLD_VITAEETERNA } from '@nw-data/common'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./zones-page.component').then((it) => it.ZonesPageComponent),
    children: [
      {
        path: NW_MAP_NEWWORLD_VITAEETERNA,
        redirectTo: '',
      },
      {
        path: ':id',
        loadComponent: () => import('./zones-detail-page.component').then((it) => it.ZoneDetailPageComponent),
      },
    ],
  },
]
