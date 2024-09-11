import { Routes } from '@angular/router'
import { MountDetailPageComponent } from './mount-detail-page.component'
import { MountsPageComponent } from './mounts-page.component'

export const ROUTES: Routes = [
  {
    path: '',
    component: MountsPageComponent,
    children: [
      {
        path: ':id',
        component: MountDetailPageComponent,
      },
    ],
  },
]
