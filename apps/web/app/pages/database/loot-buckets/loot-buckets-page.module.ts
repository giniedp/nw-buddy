import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { LootBucketsPageComponent } from './loot-buckets-page.component'
import { EmptyComponent } from '~/widgets/empty'

const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'table',
  },
  {
    path: ':category',
    component: LootBucketsPageComponent,
    children: [
      {
        path: ':id',
        component: EmptyComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  declarations: [],
})
export class LootBucketsPageModule {}
