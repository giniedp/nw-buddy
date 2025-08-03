import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./datasheets-page.component').then((it) => it.DatasheetsPageComponent),
  },
]
