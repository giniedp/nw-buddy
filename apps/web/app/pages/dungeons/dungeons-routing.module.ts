import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DungeonsComponent } from './dungeons.component';

const routes: Routes = [{ path: '', component: DungeonsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DungeonsRoutingModule { }
