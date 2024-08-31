import { Routes } from '@angular/router'
import { ShareComponent } from './share.component'

export const ROUTES: Routes = [
  {
    path: ':cid',
    component: ShareComponent,
  },
]
