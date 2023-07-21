import { NgModule } from '@angular/core'
import { StatusEffectCategoryDetailComponent } from './status-effect-category.component'
import { StatusEffectCategoryDetailDirective } from './status-effect-category.directive'

const components = [StatusEffectCategoryDetailComponent, StatusEffectCategoryDetailDirective]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class StatusEffectCategoryDetailModule {
  //
}
