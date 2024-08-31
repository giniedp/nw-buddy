import { Routes } from '@angular/router'
import { SchematicsPageComponent } from './schematics-page.component'
import { SchematicsTrackingComponent } from './schematics-tracking.component'

export const ROUTES: Routes = [
  {
    path: '',
    component: SchematicsPageComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'weaponsmithing',
      },
      {
        path: ':category',
        component: SchematicsTrackingComponent,
      },
    ],
  },
]
