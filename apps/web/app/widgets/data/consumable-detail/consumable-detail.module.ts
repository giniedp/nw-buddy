import { NgModule } from '@angular/core'
import { ConsumableDetailComponent } from './consumable-detail.component'
import { ConsumableDetailDirective } from './consumable-detail.directive'

const components = [ConsumableDetailComponent, ConsumableDetailDirective]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class ConsumableDetailModule {
  //
}
