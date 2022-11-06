import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { PlayerItemsDetailComponent } from './inventory-detail.component'
import { PlayerItemsTableComponentn } from './inventory-table.component'
import { PlayerItemsPageComponent } from './inventory.component'

const routes: Routes = [
  {
    path: '',
    component: PlayerItemsPageComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'table',
      },
      {
        path: 'table',
        component: PlayerItemsTableComponentn,
        children: [
          {
            path: ':set/:slot',
            component: PlayerItemsDetailComponent,
          },
          {
            path: ':id',
            component: PlayerItemsDetailComponent,
          },
        ],
      },
      {
        path: ':category',
        component: PlayerItemsTableComponentn,
        children: [
          {
            path: ':set/:slot',
            component: PlayerItemsDetailComponent,
          },
          {
            path: ':id',
            component: PlayerItemsDetailComponent,
          },
        ],
      },
    ],
  },
]

@NgModule({
  imports: [
    RouterModule.forChild(routes),
  ],
})
export class InventoryModule {}
