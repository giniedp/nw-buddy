import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./armor-definitions-page.component').then((it) => it.WeaponDefinitionsPageComponent),
    children: [
      {
        path: ':id',
        loadComponent: () =>
          import('./armor-definition-detail-page.component').then((it) => it.WeaponDefinitionDetailPageComponent),
      },
    ],
  },
]
