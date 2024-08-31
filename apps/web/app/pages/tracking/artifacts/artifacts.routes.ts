import { Routes } from '@angular/router'
import { ArtifactsPageComponent } from './artifacts-page.component'
import { ArtifactsTrackingComponent } from './artifacts-tracking.component'

export const ROUTES: Routes = [
  {
    path: '',
    component: ArtifactsPageComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: ArtifactsTrackingComponent,
      },
      {
        path: ':category',
        component: ArtifactsTrackingComponent,
      },
    ],
  },
]
