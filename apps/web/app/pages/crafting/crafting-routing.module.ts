import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { CraftingDetailComponent } from './crafting-detail.component'
import { CraftingRunesComponent } from './crafting-runes.component'
import { CraftingTableComponent } from './crafting-table.component'
import { CraftingTrophiesComponent } from './crafting-trophies.component'
import { CraftingComponent } from './crafting.component'

const routes: Routes = [
  {
    path: '',
    component: CraftingComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'table',
      },
      {
        path: 'runes',
        component: CraftingRunesComponent
      },
      {
        path: 'trophies',
        component: CraftingTrophiesComponent
      },
      {
        path: 'table',
        component: CraftingTableComponent,
        children: [
          {
            path: ':id',
            component: CraftingDetailComponent,
          },
        ],
      },
      {
        path: ':category',
        component: CraftingTableComponent,
        children: [
          {
            path: ':id',
            component: CraftingDetailComponent,
          },
        ],
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CraftingRoutingModule {}
