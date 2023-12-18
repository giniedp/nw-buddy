import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { NpcDetailPageComponent } from './npcs-detail-page.component'
import { NpcsPageComponent } from './npcs-page.component'

const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'table',
  },
  {
    path: ':category',
    component: NpcsPageComponent,
    children: [
      {
        path: ':id',
        component: NpcDetailPageComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  declarations: [],
})
export class NpcsPageModule {}
