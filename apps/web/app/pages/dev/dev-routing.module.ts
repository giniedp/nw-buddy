import { NgModule } from "@angular/core"
import { RouterModule, Routes } from "@angular/router"
import { DevComponent } from "./dev.component"
import { LootbucketsComponent } from "./lootbuckets"
import { LoottablesComponent } from "./loottables"


const routes: Routes = [
  {
    path: '',
    component: DevComponent,
    children: [
      {
        path: 'lootbuckets',
        component: LootbucketsComponent
      },
      {
        path: 'loottables',
        component: LoottablesComponent
      }
    ]
  },

]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DevRoutingModule {

}
