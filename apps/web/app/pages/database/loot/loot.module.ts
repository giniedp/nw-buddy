import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { LootPageComponent } from './loot.component'

const routes: Routes = [
  {
    path: '',
    component: LootPageComponent,
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  declarations: [],
})
export class LootModule {}
