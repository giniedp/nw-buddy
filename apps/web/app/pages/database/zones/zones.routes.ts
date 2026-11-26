import { Routes } from '@angular/router'
import { NW_MAP_NEWWORLD_VITAEETERNA } from '@nw-data/common'
import { injectLastMap } from './last-map'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./zones-page.component').then((it) => it.ZonesPageComponent),
    children: [
      {
        path: NW_MAP_NEWWORLD_VITAEETERNA,
        // an explicit open world link must not restore the last map
        redirectTo: () => {
          injectLastMap().set(NW_MAP_NEWWORLD_VITAEETERNA)
          return '/map'
        },
      },
      {
        path: ':id',
        loadComponent: () => import('./zones-detail-page.component').then((it) => it.ZoneDetailPageComponent),
      },
    ],
  },
]
