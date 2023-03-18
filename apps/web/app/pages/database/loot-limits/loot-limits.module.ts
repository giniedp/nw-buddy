import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { EmptyComponent } from '~/widgets/empty'
import { LootLimitDetailComponent } from './loot-limit-detail.component'

import { LootLimitsTableComponent } from './loot-limits-table.component'
import { LootLimitsComponent } from './loot-limits.component'

const routes: Routes = [
  {
    path: '',
    component: LootLimitsComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'table',
      },
      {
        path: 'table',
        component: LootLimitsTableComponent,
        children: [
          {
            path: ':id',
            component: LootLimitDetailComponent,
          },
        ],
      },
      {
        path: ':category',
        component: LootLimitsTableComponent,
        children: [
          {
            path: ':id',
            component: EmptyComponent,
          },
        ],
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class LootLimitsModule {}
