import { inject } from '@angular/core'
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, Routes } from '@angular/router'
import { PvpBucketDetailPageComponent } from './pvp-bucket-detail-page.component'
import { PvpBucketsPageComponent } from './pvp-buckets-page.component'

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
    component: PvpBucketsPageComponent,
    children: [
      {
        path: ':id',
        component: PvpBucketDetailPageComponent,
      },
    ],
  },
]
