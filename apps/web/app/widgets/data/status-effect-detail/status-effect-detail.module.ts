import { NgModule } from '@angular/core'
import { StatusEffectDetailComponent } from './status-effect.component'
import { StatusEffectDetailDirective } from './status-effect.directive'

const components = [StatusEffectDetailComponent, StatusEffectDetailDirective]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class StatusEffectDetailModule {
  //
}
