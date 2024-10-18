import { Routes } from '@angular/router'

import { WeaponDefinitionDetailPageComponent } from './weapon-definition-detail-page.component'
import { WeaponDefinitionsPageComponent } from './weapon-definitions-page.component'

export const ROUTES: Routes = [
  {
    path: 'table',
    pathMatch: 'full',
    redirectTo: '',
  },
  {
    path: '',
    component: WeaponDefinitionsPageComponent,
    children: [
      {
        path: ':id',
        component: WeaponDefinitionDetailPageComponent,
      },
    ],
  },
]
