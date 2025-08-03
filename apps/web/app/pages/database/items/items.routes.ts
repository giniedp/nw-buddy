import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./items-page.component').then((it) => it.ItemsPageComponent),
    children: [
      {
        path: ':id',
        loadComponent: () => import('./item-detail-page.component').then((it) => it.ItemDetailPageComponent),
      },
    ],
  },
]
