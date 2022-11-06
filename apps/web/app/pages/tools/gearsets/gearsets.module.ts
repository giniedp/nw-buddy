import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { GearsetComponent } from './gearset.component'
import { GearsetsComponent } from './gearsets.component'

export const routes: Routes = [
  {
    path: '',
    component: GearsetsComponent,
  },
  {
    path: ':id',
    component: GearsetComponent,
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [],
})
export class GearsetsModule {
  //
}
