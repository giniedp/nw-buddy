import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { ArmorWeightsPageComponent } from './armor-weights-page.component'

export const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'table',
  },
  {
    path: ':category',
    component: ArmorWeightsPageComponent,
    children: [
      {
        path: ':id',
        component: ArmorWeightsPageComponent,
      },
    ],
  },
]
