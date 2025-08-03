import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./music-page.component').then((it) => it.MusicPageComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./music-tracking.component').then((it) => it.MusicTrackingComponent),
      },
      {
        path: ':category',
        loadComponent: () => import('./music-tracking.component').then((it) => it.MusicTrackingComponent),
      },
    ],
  },
]
