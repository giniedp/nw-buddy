import { NgModule } from '@angular/core'
import { GameEventDetailComponent } from './game-event-detail.component'
import { GameEventDetailDirective } from './game-event-detail.directive'

const components = [GameEventDetailComponent, GameEventDetailDirective]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class GameEventDetailModule {
  //
}
