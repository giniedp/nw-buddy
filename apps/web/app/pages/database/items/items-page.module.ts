import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { ItemDetailPageComponent } from './item-detail-page.component'
import { ItemsPageComponent } from './items-page.component'

const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'table',
  },
  {
    path: ':category',
    component: ItemsPageComponent,
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
export class ItemsPageModule {}
