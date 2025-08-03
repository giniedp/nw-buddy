import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'nw_ori_er_questliang',
  },
  {
    path: ':id',
    loadComponent: () => import('./levels.component').then((it) => it.LevelsComponent),
  },
]
