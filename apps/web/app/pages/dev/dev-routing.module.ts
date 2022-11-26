import { NgModule } from "@angular/core"
import { RouterModule, Routes } from "@angular/router"
import { DbFaultsComponent } from "./db-faults"
import { DevComponent } from "./dev.component"
import { ExprFaultsComponent } from "./expr-faults"
import { DevThemeComponent } from "./theme/dev-theme.component"

const routes: Routes = [
  {
    path: '',
    component: DevComponent,
    children: [
      {
        path: '',
        redirectTo: 'db-faults',
        pathMatch: 'full'
      },
      {
        path: 'db-faults',
        component: DbFaultsComponent
      },
      {
        path: 'expr-faults',
        component: ExprFaultsComponent
      },
      {
        path: 'theme',
        component: DevThemeComponent
      },
    ]
  },

]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DevRoutingModule {

}
