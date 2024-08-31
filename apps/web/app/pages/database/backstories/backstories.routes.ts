import { inject } from '@angular/core'
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, Routes } from '@angular/router'

import { BackstoriesDetailPageComponent } from './backstories-detail-page.component'
import { BackstoriesPageComponent } from './backstories-page.component'

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
    component: BackstoriesPageComponent,
    children: [
      {
        path: ':id',
        component: BackstoriesDetailPageComponent,
      },
    ],
  },
]
