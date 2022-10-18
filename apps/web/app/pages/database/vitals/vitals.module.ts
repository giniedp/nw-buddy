import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { VitalComponent } from './vital.component'

import { VitalsTableComponent } from './vitals-table.component'
import { VitalsComponent } from './vitals.component'

const routes: Routes = [
  {
    path: '',
    component: VitalsComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'table',
      },
      {
        path: 'table',
        component: VitalsTableComponent,
        children: [
          {
            path: ':id',
            component: VitalComponent,
          },
        ],
      },
      {
        path: ':category',
        component: VitalsTableComponent,
        children: [
          {
            path: ':id',
            component: VitalComponent,
          },
        ],
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class VitalsModule {}
