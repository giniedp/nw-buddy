import { Routes } from '@angular/router'
import { LevelsComponent } from './levels.component'

export const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'nw_opr_004_trench',
  },
  {
    path: ':id',
    component: LevelsComponent,
  },
]
