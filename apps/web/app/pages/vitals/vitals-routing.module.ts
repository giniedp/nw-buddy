import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { VitalsFamiliesComponent } from './vitals-families.component'
import { VitalsTableComponent } from './vitals-table.component'
import { VitalsComponent } from './vitals.component'

const routes: Routes = [
  {
    path: '',
    component: VitalsComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'table',
      },
      {
        path: 'families',
        component: VitalsFamiliesComponent,
      },
      {
        path: 'table',
        component: VitalsTableComponent,
        children: [{
          path: ':id'
        }]
      },
      {
        path: ':category',
        component: VitalsTableComponent,
        children: [{
          path: ':id'
        }]
      },
    ],
  },

]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VitalsRoutingModule {}
