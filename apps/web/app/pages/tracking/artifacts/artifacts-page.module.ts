import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { ArtifactsPageComponent } from './artifacts-page.component'
import { ArtifactsTrackingComponent } from './artifacts-tracking.component'

const ROUTES: Routes = [
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

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  declarations: [],
})
export class ArtifactsPageModule {}
