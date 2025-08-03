import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./mounts-page.component').then((it) => it.MountsPageComponent),
    children: [
      {
        path: ':id',
        loadComponent: () => import('./mount-detail-page.component').then((it) => it.MountDetailPageComponent),
      },
    ],
  },
]
