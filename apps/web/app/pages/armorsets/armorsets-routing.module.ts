import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SetsComponent } from './armorsets.component';

const routes: Routes = [{ path: '', component: SetsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SetsRoutingModule { }
