import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./loot-buckets-page.component').then((it) => it.LootBucketsPageComponent),
    children: [
      {
        path: ':id',
        loadComponent: () =>
          import('./loot-bucket-detail-page.component').then((it) => it.LootBucketDetailPageComponent),
      },
    ],
  },
]
