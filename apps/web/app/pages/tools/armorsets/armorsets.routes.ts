import { Routes } from '@angular/router'

import { EmptyComponent } from '~/widgets/empty'

export const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'table',
  },
  {
    path: ':category',
    loadComponent: () => import('./armorsets-page.component').then((it) => it.ArmorsetsPageComponent),
    children: [
      {
        path: ':id',
        component: EmptyComponent,
      },
    ],
  },
]
