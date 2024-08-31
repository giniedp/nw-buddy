import { inject } from '@angular/core'
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, Routes } from '@angular/router'

import { LootBucketDetailPageComponent } from './loot-bucket-detail-page.component'
import { LootBucketsPageComponent } from './loot-buckets-page.component'

const redirectFromDepricated = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  return inject(Router).parseUrl(state.url.replace('/table', ''))
}

export const ROUTES: Routes = [
  {
    path: 'table',
    pathMatch: 'full',
    redirectTo: '',
  },
  {
    path: 'table/:id',
    canActivate: [redirectFromDepricated],
    children: [],
  },
  {
    path: '',
    component: LootBucketsPageComponent,
    children: [
      {
        path: ':id',
        component: LootBucketDetailPageComponent,
      },
    ],
  },
]
