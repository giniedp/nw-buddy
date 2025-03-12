import { DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { GameEventReward } from './selectors'

@Component({
  selector: 'nwb-game-event-detail-rewards',
  template: `
    @for (item of rewards; track $index) {
      <div class="flex flex-row gap-1 items-center font-bold">
        <picture [nwIcon]="item.icon" [nwRarity]="item.rarity" class="w-5 h-5 scale-125"></picture>
        @if (item.link) {
          <a [routerLink]="item.link | nwLink" class="link-hover">
            <span> {{ item.quantity ? (item.quantity | number) : '' }} {{ item.label | nwText }} </span>
          </a>
        } @else {
          <span> {{ item.quantity ? (item.quantity | number) : '' }} {{ item.label | nwText }} </span>
        }
      </div>
    }
  `,
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
