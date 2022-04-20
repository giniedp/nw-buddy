import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { AbilitiesComponent } from './abilities.component'

const routes: Routes = [
  {
    path: '',
    component: AbilitiesComponent,
    children: [
      {
        path: ':id',
        // component: AbilitiesComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AbilitiesRoutingModule {}
