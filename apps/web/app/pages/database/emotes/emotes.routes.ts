import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./emotes-page.component').then((it) => it.EmotesPageComponent),
    children: [
      {
        path: ':id',
        loadComponent: () => import('./emotes-detail-page.component').then((it) => it.EmotesDetailPageComponent),
      },
    ],
  },
]
