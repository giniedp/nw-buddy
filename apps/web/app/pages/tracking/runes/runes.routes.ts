import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./runes-page.component').then((it) => it.RunesPageComponent),
  },
]
