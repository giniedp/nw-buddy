import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AttributesComponent } from './attributes.component';

const routes: Routes = [{ path: '', component: AttributesComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AttributesRoutingModule { }
