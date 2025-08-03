import { Routes } from '@angular/router'
import { InventoryDetailComponent } from './inventory-detail.component'
import { InventoryPageComponent } from './inventory-page.component'

export const ROUTES: Routes = [
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
