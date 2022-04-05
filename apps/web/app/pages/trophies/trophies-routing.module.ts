import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TrophiesComponent } from './trophies.component';

const routes: Routes = [{ path: '', component: TrophiesComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TrophiesRoutingModule { }
