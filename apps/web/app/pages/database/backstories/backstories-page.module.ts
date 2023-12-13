import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { BackstoriesDetailPageComponent } from './backstories-detail-page.component'
import { BackstoriesPageComponent } from './backstories-page.component'

const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'table',
  },
  {
    path: ':category',
    component: BackstoriesPageComponent,
    children: [
      {
        path: ':id',
        component: BackstoriesDetailPageComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  declarations: [],
})
export class BackstoriesPageModule {}
