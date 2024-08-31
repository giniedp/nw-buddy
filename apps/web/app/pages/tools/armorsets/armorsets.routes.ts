import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { EmptyComponent } from '~/widgets/empty'
import { ArmorsetsPageComponent } from './armorsets-page.component'

export const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'table',
  },
  {
    path: ':category',
    component: ArmorsetsPageComponent,
    children: [
      {
        path: ':id',
        component: EmptyComponent,
      },
    ],
  },
]
