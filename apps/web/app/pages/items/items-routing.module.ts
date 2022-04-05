import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { ItemDetailComponent } from './item-detail.component'
import { ItemsComponent } from './items.component'

const routes: Routes = [
  {
    path: '',
    component: ItemsComponent,
  },
  {
    path: ':id',
    component: ItemDetailComponent,
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ItemsRoutingModule {}
