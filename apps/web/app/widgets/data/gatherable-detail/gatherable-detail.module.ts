import { NgModule } from '@angular/core'
import { GatherableDetailComponent } from './gatherable-detail.component'
import { GatherableDetailDirective } from './gatherable-detail.directive'

const components = [GatherableDetailComponent, GatherableDetailDirective]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class GatherableDetailModule {
  //
}
