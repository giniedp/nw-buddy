import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { EmptyComponent } from '~/widgets/empty'

import { PoiTableComponent } from './poi-table.component'
import { PoiComponent } from './poi.component'

const routes: Routes = [
  {
    path: '',
    component: PoiComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'table',
      },
      {
        path: 'table',
        component: PoiTableComponent,
        children: [
          {
            path: ':id',
            component: EmptyComponent,
          },
        ],
      },
      {
        path: ':category',
        component: PoiTableComponent,
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
export class PoiModule {}
