import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { PvpBucketsPageComponent } from './pvp-buckets-page.component'
import { EmptyComponent } from '~/widgets/empty'
import { PvpBucketDetailPageComponent } from './pvp-bucket-detail-page.component'

const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'table',
  },
  {
    path: ':category',
    component: PvpBucketsPageComponent,
    children: [
      {
        path: ':id',
        component: PvpBucketDetailPageComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  declarations: [],
})
export class PvpBucketsPageModule {}
