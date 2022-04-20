import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { ItemComponent } from './item.component'
import { ItemsComponent } from './items.component'

const routes: Routes = [
  {
    path: '',
    component: ItemsComponent,
    children: [
      {
        path: ':id',
        component: ItemComponent,
      }
    ]
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ItemsRoutingModule {}
