import { inject } from '@angular/core'
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, Routes } from '@angular/router'

import { SeasonPassDetailPageComponent } from './season-pass-detail-page.component'
import { SeasonPassPageComponent } from './season-pass-page.component'

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
    component: SeasonPassPageComponent,
    children: [
      {
        path: ':id',
        component: SeasonPassDetailPageComponent,
      },
    ],
  },
]
