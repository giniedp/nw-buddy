import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { LootBucketDetailPageComponent } from './loot-bucket-detail-page.component'
import { LootBucketsPageComponent } from './loot-buckets-page.component'

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
        component: LootBucketDetailPageComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  declarations: [],
})
export class LootBucketsPageModule {}
