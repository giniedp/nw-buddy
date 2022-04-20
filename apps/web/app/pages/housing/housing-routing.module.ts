import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HousingDetailComponent } from './housing-detail.component';
import { HousingComponent } from './housing.component';

const routes: Routes = [
  {
    path: '',
    component: HousingComponent,
    children: [
      {
        path: ':id',
        component: HousingDetailComponent,
      }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HousingRoutingModule { }
