import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./umbral-calculator-page.component').then((it) => it.UmbralCalculatorPageComponent),
  },
]
