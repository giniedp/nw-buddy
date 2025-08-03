import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./schematics-page.component').then((it) => it.SchematicsPageComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'weaponsmithing',
      },
      {
        path: ':category',
        loadComponent: () => import('./schematics-tracking.component').then((it) => it.SchematicsTrackingComponent),
      },
    ],
  },
]
