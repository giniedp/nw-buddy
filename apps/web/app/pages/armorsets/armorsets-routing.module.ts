import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { ArmorsetComponent } from './armorset.component'
import { ArmorsetsComponent } from './armorsets.component'

const routes: Routes = [
  {
    path: '',
    component: ArmorsetsComponent,
    children: [
      {
        path: ':id',
        component: ArmorsetComponent,
      },
    ],
  },
]
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SetsRoutingModule {}
