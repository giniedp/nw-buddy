import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./damage-calculator-page.component').then((it) => it.DamageCalculatorPageComponent),
  },
]
