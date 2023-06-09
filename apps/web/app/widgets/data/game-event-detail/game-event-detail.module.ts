import { NgModule } from '@angular/core'
import { GameEventDetailComponent } from './game-event-detail.component'
import { GameEventDetailDirective } from './game-event-detail.directive'
import { GameEventDetailRewardsComponent } from './game-event-detail-rewards.component'

const components = [GameEventDetailComponent, GameEventDetailDirective, GameEventDetailRewardsComponent]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class GameEventDetailModule {
  //
}
