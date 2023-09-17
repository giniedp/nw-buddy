import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { AbilitiesDetailPageComponent } from './abilities-detail-page.component'
import { AbilitiesPageComponent } from './abilities-page.component'

const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'table',
  },
  {
    path: ':category',
    component: AbilitiesPageComponent,
    children: [
      {
        path: ':id',
        component: AbilitiesDetailPageComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  declarations: [],
})
export class AbilitiesPageModule {}
