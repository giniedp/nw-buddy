import { NgModule } from '@angular/core'
import { MountDetailComponent } from './mount-detail.component'
import { MountDetailDirective } from './mount-detail.directive'

const components = [MountDetailComponent, MountDetailDirective]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class MountDetailModule {
  //
}
