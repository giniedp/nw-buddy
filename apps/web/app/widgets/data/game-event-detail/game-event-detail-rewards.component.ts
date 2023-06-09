import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { NwModule } from '~/nw'
import { RouterModule } from '@angular/router'
import { GameEventReward } from './selectors'

@Component({
  standalone: true,
  selector: 'nwb-game-event-detail-rewards',
  templateUrl: './game-event-detail-rewards.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, RouterModule],
  host: {
    class: 'flex flex-col',
  },
})
export class GameEventDetailRewardsComponent {
  @Input()
  public rewards: GameEventReward[]
}
