import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./backstories-page.component').then((it) => it.BackstoriesPageComponent),
    children: [
      {
        path: ':id',
        loadComponent: () =>
          import('./backstories-detail-page.component').then((it) => it.BackstoriesDetailPageComponent),
      },
    ],
  },
]
