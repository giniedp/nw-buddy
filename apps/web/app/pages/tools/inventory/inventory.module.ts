import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { InventoryDetailComponent } from './inventory-detail.component'
import { PlayerItemsTableComponentn } from './inventory-table.component'
import { InventoryPageComponent } from './inventory-page.component'

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'table',
  },
  {
    path: ':category',
    component: InventoryPageComponent,
    children: [
      {
        path: ':set/:slot',
        component: InventoryDetailComponent,
      },
      {
        path: ':id',
        component: InventoryDetailComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class InventoryModule {}
