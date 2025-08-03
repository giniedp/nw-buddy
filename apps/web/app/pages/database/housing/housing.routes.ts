import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./housing-page.component').then((it) => it.HousingPageComponent),
    children: [
      {
        path: ':id',
        loadComponent: () => import('./housing-detail-page.component').then((it) => it.HousingDetailPageComponent),
      },
    ],
  },
]
