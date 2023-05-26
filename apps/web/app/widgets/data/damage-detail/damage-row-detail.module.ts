import { NgModule } from '@angular/core'
import { DamageRowDetailComponent } from './damage-row-detail.component'
import { DamageRowDetailDirective } from './damage-row-detail.directive'

const components = [DamageRowDetailComponent, DamageRowDetailDirective]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class DamageRowDetailModule {
  //
}
