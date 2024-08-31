import { inject } from '@angular/core'
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, Routes } from '@angular/router'

import { StatusEffectsDetailPageComponent } from './status-effects-detail-page.component'
import { StatusEffectsPageComponent } from './status-effects-page.component'

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
    component: StatusEffectsPageComponent,
    children: [
      {
        path: ':id',
        component: StatusEffectsDetailPageComponent,
      },
    ],
  },
]
