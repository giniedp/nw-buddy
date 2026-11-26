import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    // the viewer app owns every path below /pak (its own router), one component for all of them
    path: '**',
    loadComponent: () => import('./pak-page.component').then((it) => it.PakPageComponent),
  },
]
