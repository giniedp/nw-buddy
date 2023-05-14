import { NgModule } from '@angular/core'
import { PerkBucketDetailPerksComponent } from './perk-bucket-detail.component'
import { PerkBucketDetailDirective } from './perk-bucket-detail.directive'
import { PerkBucketDetailTabsComponent } from './perk-bucket-detail-tabs.component'

const COMPONENTS = [PerkBucketDetailPerksComponent, PerkBucketDetailDirective, PerkBucketDetailTabsComponent]
@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class PerkBucketDetailModule {
  //
}
