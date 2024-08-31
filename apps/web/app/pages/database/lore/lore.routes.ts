import { inject } from '@angular/core'
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, Routes } from '@angular/router'

import { LoreDetailPageComponent } from './lore-detail-page.component'
import { LorePageComponent } from './lore-page.component'

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
    component: LorePageComponent,
    children: [
      {
        path: ':id',
        component: LoreDetailPageComponent,
      },
    ],
  },
]
