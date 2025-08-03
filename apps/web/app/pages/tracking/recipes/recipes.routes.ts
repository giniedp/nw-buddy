import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./recipes-page.component').then((it) => it.RecipesPageComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./recipes-tracking.component').then((it) => it.RecipesTrackingComponent),
      },
      {
        path: ':category',
        loadComponent: () => import('./recipes-tracking.component').then((it) => it.RecipesTrackingComponent),
      },
    ],
  },
]
