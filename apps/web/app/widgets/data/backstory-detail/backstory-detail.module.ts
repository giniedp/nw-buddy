import { NgModule } from '@angular/core'
import { BackstoryDetailComponent } from './backstory-detail.component'
import { BackstoryLootTreeComponent } from './backstory-loot-tree.component'

const components = [BackstoryDetailComponent, BackstoryLootTreeComponent]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class BackstoryDetailModule {
  //
}
