import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./gatherables-page.component').then((it) => it.GatherablesPageComponent),
    children: [
      {
        path: ':id',
        loadComponent: () =>
          import('./gatherable-detail-page.component').then((it) => it.GatherableDetailPageComponent),
      },
    ],
  },
]
