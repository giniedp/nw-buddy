import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { ArmorsetsTableComponent } from './armorsets-table.component'
import { ArmorsetsComponent } from './armorsets.component'

const routes: Routes = [
  {
    path: '',
    component: ArmorsetsComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'table',
      },
      {
        path: 'table',
        component: ArmorsetsTableComponent,
        children: [{
          path: ':id',
        }]
      },
      {
        path: ':category',
        component: ArmorsetsTableComponent,
        children: [{
          path: ':id',
        }]
      },
    ],
  },
]
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SetsRoutingModule {}
