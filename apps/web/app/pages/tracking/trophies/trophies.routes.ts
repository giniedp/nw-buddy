import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./trophies-page.component').then((it) => it.RunesPageComponent),
  },
]
