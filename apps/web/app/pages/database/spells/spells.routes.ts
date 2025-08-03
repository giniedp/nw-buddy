import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./spells-page.component').then((it) => it.SpellsPageComponent),
    children: [
      {
        path: ':id',
        loadComponent: () => import('./spells-detail-page.component').then((it) => it.SpellsDetailPageComponent),
      },
    ],
  },
]
