import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { EmptyComponent } from '~/widgets/empty'
import { AbilitiesDetailComponent } from './status-effects-detail.component'
import { StatusEffectsTableComponent } from './status-effects-table.component'
import { StatusEffectsComponent } from './status-effects.component'

const routes: Routes = [
  {
    path: '',
    component: StatusEffectsComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'table',
      },
      {
        path: 'table',
        component: StatusEffectsTableComponent,
        children: [
          {
            path: ':id',
            component: AbilitiesDetailComponent,
          },
        ],
      },
      {
        path: ':category',
        component: StatusEffectsTableComponent,
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
export class StatusEffectsModule {}
