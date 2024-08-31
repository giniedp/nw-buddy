import { inject } from '@angular/core'
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, Routes } from '@angular/router'

import { CraftingDetailPageComponent } from './crafting-detail-page.component'
import { CraftingPageComponent } from './crafting-page.component'

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
    component: CraftingPageComponent,
    children: [
      {
        path: ':id',
        component: CraftingDetailPageComponent,
      },
    ],
  },
]
