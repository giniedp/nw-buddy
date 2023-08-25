import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { TransmogComponent } from './transmog.component'
import { TransmogOverviewComponent } from './transmog-overview.component'
import { TransmogItemComponent } from './transmog-item.component'
import { CATEGORIES } from '~/widgets/data/appearance-detail'

const ROUTES: Routes = [
  {
    path: '',
    component: TransmogOverviewComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: CATEGORIES[0].id,
      },
      {
        path: ':category',
        component: TransmogComponent,
        children: [
          {
            path: ':id',
            component: TransmogItemComponent,
          },
        ],
      },
    ],
  },
]

@NgModule({
  imports: [
    RouterModule.forChild(ROUTES),
  ],
})
export class TransmogModule {}
