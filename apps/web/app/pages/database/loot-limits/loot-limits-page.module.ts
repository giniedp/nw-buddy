import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { LootLimitDetailPageComponent } from './loot-limit-detail-page.component'

import { LootLimitsPageComponent } from './loot-limits-page.component'

const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'table',
  },
  {
    path: ':category',
    component: LootLimitsPageComponent,
    children: [
      {
        path: ':id',
        component: LootLimitDetailPageComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  declarations: [],
})
export class LootLimitsPageModule {}
