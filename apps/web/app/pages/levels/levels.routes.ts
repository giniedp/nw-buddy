import { Routes } from '@angular/router'
import { LevelsComponent } from './levels.component'

export const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'nw_ori_er_questliang',
  },
  {
    path: ':id',
    component: LevelsComponent,
  },
]
