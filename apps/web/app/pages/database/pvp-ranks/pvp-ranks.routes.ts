import { inject } from '@angular/core'
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, Routes } from '@angular/router'
import { PvpRankDetailPageComponent } from './pvp-rank-detail-page.component'
import { PvpRanksPageComponent } from './pvp-ranks-page.component'

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
    component: PvpRanksPageComponent,
    children: [
      {
        path: ':id',
        component: PvpRankDetailPageComponent,
      },
    ],
  },
]
