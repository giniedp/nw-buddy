import { NgModule } from '@angular/core'
import { PerkBucketDetailTabsComponent } from './perk-bucket-detail-tabs.component'

const COMPONENTS = [PerkBucketDetailTabsComponent]
@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class PerkBucketDetailModule {
  //
}
