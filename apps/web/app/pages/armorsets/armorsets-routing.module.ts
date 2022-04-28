import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { ArmorsetsComponent } from './armorsets.component'

const routes: Routes = [
  {
    path: '',
    component: ArmorsetsComponent,
    children: [
      {
        path: ':id',
      },
    ],
  },
]
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SetsRoutingModule {}
