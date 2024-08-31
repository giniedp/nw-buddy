import { Routes } from '@angular/router'

import { TerritoriesGovernanceComponent } from './territories-governance.component'
import { TerritoriesListComponent } from './territories-list.component'
import { TerritoriesStandingComponent } from './territories-standing.component'
import { TerritoriesComponent } from './territories.component'

export const ROUTES: Routes = [
  {
    path: '',
    component: TerritoriesComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'list',
      },
      {
        path: 'list',
        component: TerritoriesListComponent,
      },
      {
        path: 'standing',
        component: TerritoriesStandingComponent,
      },
      {
        path: 'governance',
        component: TerritoriesGovernanceComponent,
      },
    ],
  },
]
