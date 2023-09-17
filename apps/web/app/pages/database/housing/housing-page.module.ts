import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { HousingDetailPageComponent } from './housing-detail-page.component'
import { HousingPageComponent } from './housing-page.component'

const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'table',
  },
  {
    path: ':category',
    component: HousingPageComponent,
    children: [
      {
        path: ':id',
        component: HousingDetailPageComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  declarations: [],
})
export class HousingPageModule {}
