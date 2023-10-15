import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { ItemDetailPageComponent } from './gatherable-detail-page.component'
import { GatherablesPageComponent } from './gatherables-page.component'

const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'table',
  },
  {
    path: ':category',
    component: GatherablesPageComponent,
    children: [
      {
        path: ':id',
        component: ItemDetailPageComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  declarations: [],
})
export class GatherablesPageModule {}
