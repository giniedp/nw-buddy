import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pak-page.component').then((it) => it.PakPageComponent),
  },
]
