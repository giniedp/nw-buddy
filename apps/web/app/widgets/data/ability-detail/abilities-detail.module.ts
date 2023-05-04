import { NgModule } from '@angular/core'
import { AbilityDetailComponent } from './ability-detail.component'
import { AbilityDetailDirective } from './ability-detail.directive'

const components = [AbilityDetailComponent, AbilityDetailDirective]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class AbilityDetailModule {
  //
}
