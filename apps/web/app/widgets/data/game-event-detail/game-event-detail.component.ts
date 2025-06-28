import { DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, inject, signal } from '@angular/core'
import { GameEventData } from '@nw-data/generated'
import { PropertyGridModule, gridDescriptor } from '~/ui/property-grid'
import { linkCell, valueCell } from '~/ui/property-grid/cells'
import { diffButtonCell } from '~/widgets/diff-tool'
import { GameEventDetailRewardsComponent } from './game-event-detail-rewards.component'
import { GameEventDetailStore } from './game-event-detail.store'

@Component({
  selector: 'nwb-game-event-detail',
  templateUrl: './game-event-detail.component.html',
  exportAs: 'detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PropertyGridModule, GameEventDetailRewardsComponent],
  providers: [DecimalPipe, GameEventDetailStore],
  host: {
    class: 'flex flex-col gap-2 text-sm',
  },
})
export class GameEventDetailComponent {
  public readonly store = inject(GameEventDetailStore)
  protected decimals = inject(DecimalPipe)

  public readonly props = this.store.properties
  public readonly rewards = this.store.rewards
  public readonly lootTableId = this.store.lootTableId

  public readonly showProps = signal(true)
  public readonly showRewards = signal(true)

  @Input()
  public set eventId(value: string) {
    this.store.load({ eventId: value })
  }

  public descriptor = gridDescriptor<GameEventData>(
    {
      EventID: (value) => {
        return [
          linkCell({ value: String(value), routerLink: ['game-event', value] }),
          diffButtonCell({ record: this.store.gameEvent(), idKey: 'EventID' }),
        ]
      },
      LootLimitReachedGameEventId: (value) => linkCell({ value: String(value), routerLink: ['game-event', value] }),
      LootLimitId: (value) => linkCell({ value: String(value), routerLink: ['loot-limit', value] }),
      ItemReward: (value) => {
        const id = String(value)
        if (id.startsWith('[LTID]')) {
          return linkCell({ value, routerLink: ['loot', id.replace('[LTID]', '')] })
        }
        if (id.includes('HousingItem')) {
          return linkCell({ value, routerLink: ['housing', value] })
        }
        return linkCell({ value, routerLink: ['item', value] })
      },
    },
    (value) => valueCell({ value }),
  )
}
