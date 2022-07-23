import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { AttributesTableComponent } from '~/widgets/attributes-table/attributes-table.component'
import { EmptyComponent } from '~/widgets/empty'
import { PerksTableComponent } from './perks-table.component'

import { PerksComponent } from './perks.component'

const routes: Routes = [
  {
    path: '',
    component: PerksComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'table',
      },
      {
        path: 'attributes',
        component: AttributesTableComponent,
      },
      {
        path: 'table',
        component: PerksTableComponent,
        children: [{
          path: ':id',
          component: EmptyComponent
        }]
      },
      {
        path: ':category',
        component: PerksTableComponent,
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
  exports: [RouterModule],
})
export class PerksRoutingModule {}
