import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { ZoneDetailPageComponent } from './zones-detail-page.component'
import { ZonePageComponent } from './zones-page.component'

const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'table',
  },
  {
    path: ':category',
    component: ZonePageComponent,
    children: [
      {
        path: ':id',
        component: ZoneDetailPageComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  declarations: [],
})
export class PoiPageModule {}
