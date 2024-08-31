import { Routes } from '@angular/router'
import { RecipesPageComponent } from './recipes-page.component'
import { RecipesTrackingComponent } from './recipes-tracking.component'

export const ROUTES: Routes = [
  {
    path: '',
    component: RecipesPageComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: RecipesTrackingComponent,
      },
      {
        path: ':category',
        component: RecipesTrackingComponent,
      },
    ],
  },
]
