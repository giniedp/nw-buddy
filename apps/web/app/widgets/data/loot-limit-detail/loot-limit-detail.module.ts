import { NgModule } from '@angular/core'
import { LootLimitDetailComponent } from './loot-limit-detail.component'
import { LootLimitDetailDirective } from './loot-limit-detail.directive'

const components = [LootLimitDetailComponent, LootLimitDetailDirective]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class LootLimitDetailModule {
  //
}
