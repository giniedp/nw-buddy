import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: ':cid',
    loadComponent: () => import('./share.component').then((it) => it.ShareComponent),
  },
]
