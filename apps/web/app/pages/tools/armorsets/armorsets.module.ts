import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { EmptyComponent } from '~/widgets/empty'
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
          component: EmptyComponent
        }]
      },
      {
        path: ':category',
        component: ArmorsetsTableComponent,
        children: [{
          path: ':id',
          component: EmptyComponent
        }]
      },
    ],
  },
]
@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class ArmorsetsModule {}
