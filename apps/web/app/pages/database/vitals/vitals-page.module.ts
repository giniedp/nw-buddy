import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { VitalDetailComponent } from './vital-detail-page.component'
import { VitalsPageComponent } from './vitals-page.component'

const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'table',
  },
  {
    path: ':category',
    component: VitalsPageComponent,
    children: [
      {
        path: ':id',
        component: VitalDetailComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  declarations: [],
})
export class VitalsPageModule {}
