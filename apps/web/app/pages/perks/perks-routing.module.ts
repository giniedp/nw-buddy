import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { PerksComponent } from './perks.component'

const routes: Routes = [
  {
    path: '',
    component: PerksComponent,
    children: [
      {
        path: ':id',
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PerksRoutingModule {}
