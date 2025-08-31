import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./actionlists-page.component').then((it) => it.ActionlistsPageComponent),
  },
]
