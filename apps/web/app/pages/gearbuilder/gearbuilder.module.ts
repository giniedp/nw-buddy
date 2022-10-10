import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { ROUTES } from './gearbuilder.routes'

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  exports: [],
})
export class GearbuilderModule {
  //
}
