import { NgModule } from '@angular/core'
import { MutaElementDetailComponent } from './muta-element-detail.component'
import { MutaElementDetailDirective } from './muta-element-detail.directive'

const components = [MutaElementDetailComponent, MutaElementDetailDirective]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class MutaElementDetailModule {
  //
}
