import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { PerksDetailComponent } from './perks-detail.component'
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
        path: 'table',
        component: PerksTableComponent,
        children: [
          {
            path: ':id',
            component: PerksDetailComponent,
          },
        ],
      },
      {
        path: ':category',
        component: PerksTableComponent,
        children: [
          {
            path: ':id',
            component: PerksDetailComponent,
          },
        ],
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class PerksModule {}
