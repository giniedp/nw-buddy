import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./artifacts-page.component').then((it) => it.ArtifactsPageComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./artifacts-tracking.component').then((it) => it.ArtifactsTrackingComponent),
      },
      {
        path: ':category',
        loadComponent: () => import('./artifacts-tracking.component').then((it) => it.ArtifactsTrackingComponent),
      },
    ],
  },
]
