import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { CraftingDetailComponent } from './crafting-detail.component'
import { CraftingComponent } from './crafting.component'

const routes: Routes = [
  {
    path: '',
    component: CraftingComponent,
    children: [
      {
        path: ':id',
        component: CraftingDetailComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CraftingRoutingModule {}
