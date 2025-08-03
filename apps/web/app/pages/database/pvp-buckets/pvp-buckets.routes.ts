import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pvp-buckets-page.component').then((it) => it.PvpBucketsPageComponent),
    children: [
      {
        path: ':id',
        loadComponent: () => import('./pvp-bucket-detail-page.component').then((it) => it.PvpBucketDetailPageComponent),
      },
    ],
  },
]
