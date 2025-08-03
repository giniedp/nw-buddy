import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./lore-page.component').then((it) => it.LorePageComponent),
    children: [
      {
        path: ':id',
        loadComponent: () => import('./lore-page.component').then((it) => it.LorePageComponent),
      },
    ],
  },
]
