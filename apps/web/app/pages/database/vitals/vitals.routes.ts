import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./vitals-page.component').then((it) => it.VitalsPageComponent),
    children: [
      {
        path: ':id',
        loadComponent: () => import('./vital-detail-page.component').then((it) => it.VitalDetailPageComponent),
      },
    ],
  },
]
