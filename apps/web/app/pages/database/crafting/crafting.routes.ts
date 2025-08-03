import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./crafting-page.component').then((it) => it.CraftingPageComponent),
    children: [
      {
        path: ':id',
        loadComponent: () => import('./crafting-detail-page.component').then((it) => it.CraftingDetailPageComponent),
      },
    ],
  },
]
