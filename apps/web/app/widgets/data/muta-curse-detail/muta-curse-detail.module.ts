import { NgModule } from '@angular/core'
import { MutaCurseDetailComponent } from './muta-curse-detail.component'
import { MutaCurseDetailDirective } from './muta-curse-detail.directive'

const components = [MutaCurseDetailComponent, MutaCurseDetailDirective]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class MutaCurseDetailModule {
  //
}
