import { NgModule } from '@angular/core'
import { StatusEffectCategoryDetailComponent } from './status-effect-category-detail.component'
import { StatusEffectCategoryDetailDirective } from './status-effect-category-detail.directive'
import { StatusEffectLimitsTableComponent } from './status-effect-limits-table.component'

const components = [
  StatusEffectCategoryDetailComponent,
  StatusEffectCategoryDetailDirective,
  StatusEffectLimitsTableComponent,
]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class StatusEffectCategoryDetailModule {
  //
}
