import { Routes } from '@angular/router'
import { MusicPageComponent } from './music-page.component'
import { MusicTrackingComponent } from './music-tracking.component'

export const ROUTES: Routes = [
  {
    path: '',
    component: MusicPageComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: MusicTrackingComponent,
      },
      {
        path: ':category',
        component: MusicTrackingComponent,
      },
    ],
  },
]
