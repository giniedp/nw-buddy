import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'table',
  },
  {
    path: ':category',
    loadComponent: () => import('./armor-weights-page.component').then((it) => it.ArmorWeightsPageComponent),
    children: [
      {
        path: ':id',
        loadComponent: () => import('./armor-weights-page.component').then((it) => it.ArmorWeightsPageComponent),
      },
    ],
  },
]
