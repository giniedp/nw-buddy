import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { ItemComponent } from './item.component'
import { ItemsTableComponent } from './items-table.component'
import { ItemsComponent } from './items.component'

const routes: Routes = [
  {
    path: '',
    component: ItemsComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'table',
      },
      {
        path: 'table',
        component: ItemsTableComponent,
        children: [{
          path: ':id',
          component: ItemComponent
        }]
      },
      {
        path: ':category',
        component: ItemsTableComponent,
        children: [{
          path: ':id',
          component: ItemComponent
        }]
      },
    ]
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ItemsRoutingModule {}
