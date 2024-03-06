import { NgModule } from '@angular/core'

import { LootBucketDetailDirective } from './loot-bucket-detail.directive'
import { LootBucketDetailComponent } from './loot-bucket-detail.component'

const components = [LootBucketDetailDirective, LootBucketDetailComponent]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class LootBucketDetailModule {
  //
}
