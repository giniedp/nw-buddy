import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { XpComponent } from './xp.component';

const routes: Routes = [{ path: '', component: XpComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class XpRoutingModule { }
