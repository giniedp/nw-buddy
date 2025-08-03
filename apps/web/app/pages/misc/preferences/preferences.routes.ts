import { Routes } from '@angular/router'
import { PreferencesComponent } from './preferences.component'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./preferences.component').then((it) => PreferencesComponent),
  },
]
