import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { HousingDetailComponent } from './housing-detail.component'
import { HousingTableComponent } from './housing-table.component'
import { HousingComponent } from './housing.component'

const routes: Routes = [
  {
    path: '',
    component: HousingComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'table',
      },
      {
        path: 'table',
        component: HousingTableComponent,
        children: [
          {
            path: ':id',
            component: HousingDetailComponent,
          },
        ],
      },
      {
        path: ':category',
        component: HousingTableComponent,
        children: [
          {
            path: ':id',
            component: HousingDetailComponent,
          },
        ],
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class HousingModule {}
