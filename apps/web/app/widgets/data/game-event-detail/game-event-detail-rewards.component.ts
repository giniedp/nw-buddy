import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { GameEventReward } from './selectors'
import { DecimalPipe } from '@angular/common'

@Component({
  standalone: true,
  selector: 'nwb-game-event-detail-rewards',
  templateUrl: './game-event-detail-rewards.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NwModule, DecimalPipe, RouterModule],
  host: {
    class: 'flex flex-col',
  },
})
export class GameEventDetailRewardsComponent {
  @Input()
  public rewards: GameEventReward[]
}
