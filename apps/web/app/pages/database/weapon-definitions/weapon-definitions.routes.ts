import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./weapon-definitions-page.component').then((it) => it.WeaponDefinitionsPageComponent),
    children: [
      {
        path: ':id',
        loadComponent: () =>
          import('./weapon-definition-detail-page.component').then((it) => it.WeaponDefinitionDetailPageComponent),
      },
    ],
  },
]
