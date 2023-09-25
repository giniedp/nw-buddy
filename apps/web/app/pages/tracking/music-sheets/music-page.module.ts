import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { MusicPageComponent } from './music-page.component'
import { MusicTrackingComponent } from './music-tracking.component'

const ROUTES: Routes = [
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

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  declarations: [],
})
export class MusicPageModule {}
