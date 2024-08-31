
import { inject } from '@angular/core'
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, Routes } from '@angular/router'

import { LootLimitDetailPageComponent } from './loot-limit-detail-page.component'
import { LootLimitsPageComponent } from './loot-limits-page.component'

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
    component: LootLimitsPageComponent,
    children: [
      {
        path: ':id',
        component: LootLimitDetailPageComponent,
      },
    ],
  },
]
