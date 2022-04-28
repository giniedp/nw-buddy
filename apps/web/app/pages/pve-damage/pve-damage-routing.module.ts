import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PveDamageComponent } from './pve-damage.component';

const routes: Routes = [{ path: '', component: PveDamageComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PveDamageRoutingModule { }
