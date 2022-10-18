import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { UmbralShardsComponent } from './umbral-shards.component'

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: UmbralShardsComponent,
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [],
})
export class UmbralShardsModule {
  //
}
