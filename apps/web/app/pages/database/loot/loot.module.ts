import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { LootPageComponent } from './loot.component'
import { LootTablePageComponent } from './loot-table.component'
import { LootDetailPageComponent } from './loot-detail.component'

const routes: Routes = [
  {
    path: '',
    component: LootPageComponent,
    children: [
      {
        path: '',
        component: LootTablePageComponent,
        children: [{
          path: ':id',
          component: LootDetailPageComponent
        }]
      },

    ]
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  declarations: [],
})
export class LootModule {}
