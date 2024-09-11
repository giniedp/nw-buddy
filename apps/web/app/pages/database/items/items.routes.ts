import { inject } from '@angular/core'
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, Routes } from '@angular/router'

import { ItemDetailPageComponent } from './item-detail-page.component'
import { ItemsPageComponent } from './items-page.component'
import { EmptyComponent } from '~/widgets/empty'

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
    component: ItemsPageComponent,
    children: [
      {
        path: ':id',
        component: ItemDetailPageComponent,
      },
    ],
  },
]
