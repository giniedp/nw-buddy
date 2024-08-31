import { inject } from '@angular/core'
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, Routes } from '@angular/router'

import { GatherableDetailPageComponent } from './gatherable-detail-page.component'
import { GatherablesPageComponent } from './gatherables-page.component'

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
    component: GatherablesPageComponent,
    children: [
      {
        path: ':id',
        component: GatherableDetailPageComponent,
      },
    ],
  },
]
