import { NgModule } from '@angular/core'
import { EntitlementDetailComponent } from './entitlement-detail.component'
import { EntitlementDetailDirective } from './entitlement-detail.directive'

const components = [EntitlementDetailComponent, EntitlementDetailDirective]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class EntitlementDetailModule {
  //
}
