import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { GearbuilderSetComponent } from './gearbuilder-set.component'
import { GearbuilderComponent } from './gearbuilder.component'

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: GearbuilderComponent,
  },
  {
    path: ':id',
    component: GearbuilderSetComponent,
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [],
})
export class GearbuilderModule {
  //
}
