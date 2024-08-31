import { inject } from '@angular/core'
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, Routes } from '@angular/router'

import { PlayerTitleDetailPageComponent } from './player-title-detail-page.component'
import { PlayerTitlesPageComponent } from './player-titles-page.component'

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
    component: PlayerTitlesPageComponent,
    children: [
      {
        path: ':id',
        component: PlayerTitleDetailPageComponent,
      },
    ],
  },
]
