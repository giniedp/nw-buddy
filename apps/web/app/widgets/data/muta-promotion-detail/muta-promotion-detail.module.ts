import { NgModule } from '@angular/core'
import { MutaPromotionDetailComponent } from './muta-promotion-detail.component'
import { MutaPromotionDetailDirective } from './muta-promotion-detail.directive'

const components = [MutaPromotionDetailComponent, MutaPromotionDetailDirective]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class MutaPromotionDetailModule {
  //
}
