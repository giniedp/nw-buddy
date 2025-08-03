import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./npcs-page.component').then((it) => it.NpcsPageComponent),
    children: [
      {
        path: ':id',
        loadComponent: () => import('./npcs-detail-page.component').then((it) => it.NpcDetailPageComponent),
      },
    ],
  },
]
