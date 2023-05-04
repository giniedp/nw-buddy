import { NgModule } from '@angular/core'
import { SpellDetailComponent } from './spell-detail.component'
import { SpellDetailDirective } from './spell-detail.directive'

const components = [SpellDetailComponent, SpellDetailDirective]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class SpellDetailModule {
  //
}
