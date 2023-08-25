import { NgModule } from '@angular/core'
import { AppearanceDetailComponent } from './appearance-detail.component'
import { AppearanceDetailDirective } from './appearance-detail.directive'

const components = [AppearanceDetailComponent, AppearanceDetailDirective]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class AppearanceDetailModule {
  //
}
