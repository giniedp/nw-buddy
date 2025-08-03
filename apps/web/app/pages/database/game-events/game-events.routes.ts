import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./game-events-page.component').then((it) => it.GameEventsPageComponent),
    children: [
      {
        path: ':id',
        loadComponent: () => import('./game-event-detail-page.component').then((it) => it.GameEventDetailPageComponent),
      },
    ],
  },
]
