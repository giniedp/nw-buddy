import { NgModule } from '@angular/core'
import { QuestDetailComponent } from './quest-detail.component'
import { QuestDetailDirective } from './quest-detail.directive'
import { QuestDetailFollowUpComponent } from './quest-detail-follow-up.component'

const components = [QuestDetailComponent, QuestDetailDirective, QuestDetailFollowUpComponent]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class QuestDetailModule {
  //
}
