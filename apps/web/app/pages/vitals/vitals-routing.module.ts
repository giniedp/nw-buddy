import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VitalComponent } from './vital.component';
import { VitalsComponent } from './vitals.component';

const routes: Routes =  [
  {
    path: '',
    component: VitalsComponent,
    children: [
      {
        path: ':id',
        component: VitalComponent
      }
    ]
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VitalsRoutingModule { }
