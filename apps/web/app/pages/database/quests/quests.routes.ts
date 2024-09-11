import { inject } from '@angular/core'
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, Routes } from '@angular/router'

import { QuestDetailPageComponent } from './quest-detail-page.component'
import { QuestsPageComponent } from './quests-page.component'

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
    component: QuestsPageComponent,
    children: [
      {
        path: ':id',
        component: QuestDetailPageComponent,
      },
    ],
  },
]