import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { AbilitiesDetailComponent } from './abilities-detail.component'
import { AbilitiesTableComponent } from './abilities-table.component'
import { AbilitiesComponent } from './abilities.component'

const routes: Routes = [
  {
    path: '',
    component: AbilitiesComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'table',
      },
      {
        path: 'table',
        component: AbilitiesTableComponent,
        children: [
          {
            path: ':id',
            component: AbilitiesDetailComponent,
          },
        ],
      },
      {
        path: ':category',
        component: AbilitiesTableComponent,
        children: [
          {
            path: ':id',
            component: AbilitiesDetailComponent,
          },
        ],
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class AbilitiesModule {}
