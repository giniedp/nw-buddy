import { inject } from '@angular/core'
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, Routes } from '@angular/router'

const redirectFromDepricated = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  return inject(Router).parseUrl(state.url.replace('/table', ''))
}

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./status-effects-page.component').then((it) => it.StatusEffectsPageComponent),
    children: [
      {
        path: ':id',
        loadComponent: () =>
          import('./status-effects-detail-page.component').then((it) => it.StatusEffectsDetailPageComponent),
      },
    ],
  },
]
