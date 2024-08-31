import { inject } from '@angular/core'
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, Routes } from '@angular/router'

import { AbilitiesDetailPageComponent } from './abilities-detail-page.component'
import { AbilitiesPageComponent } from './abilities-page.component'

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
    component: AbilitiesPageComponent,
    children: [
      {
        path: ':id',
        component: AbilitiesDetailPageComponent,
      },
    ],
  },
]
