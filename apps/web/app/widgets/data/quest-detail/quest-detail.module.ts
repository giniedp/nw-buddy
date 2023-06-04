import { NgModule } from '@angular/core'
import { QuestDetailComponent } from './quest-detail.component'
import { QuestDetailDirective } from './quest-detail.directive'

const components = [QuestDetailComponent, QuestDetailDirective]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class QuestDetailModule {
  //
}
