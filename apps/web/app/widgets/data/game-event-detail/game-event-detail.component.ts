import { DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, inject, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { GameEventData } from '@nw-data/generated'
import { PropertyGridCell, PropertyGridModule } from '~/ui/property-grid'
import { GameEventDetailRewardsComponent } from './game-event-detail-rewards.component'
import { GameEventDetailStore } from './game-event-detail.store'
import { patchState } from '@ngrx/signals'

@Component({
  standalone: true,
  selector: 'nwb-game-event-detail',
  templateUrl: './game-event-detail.component.html',
  exportAs: 'detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PropertyGridModule, DecimalPipe, GameEventDetailRewardsComponent],
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
    patchState(this.store, { eventId: value })
  }

  public formatValue = (value: any, key: keyof GameEventData): PropertyGridCell | PropertyGridCell[] => {
    switch (key) {
      case 'EventID': {
        return [
          {
            value: String(value),
            accent: true,
            routerLink: ['game-event', value],
          },
        ]
      }
      case 'LootLimitReachedGameEventId':
      case 'LootLimitId': {
        return [
          {
            value: String(value),
            accent: true,
            routerLink: ['loot-limit', value],
          },
        ]
      }
      case 'ItemReward': {
        const id = String(value)
        if (id.startsWith('[LTID]')) {
          return [
            {
              value: value,
              accent: true,
              routerLink: ['loot', id.replace('[LTID]', '')],
            },
          ]
        }
        if (id.includes('HousingItem')) {
          return [
            {
              value: value,
              accent: true,
              routerLink: ['housing', value],
            },
          ]
        }
        return [
          {
            value: value,
            accent: true,
            routerLink: ['item', value],
          },
        ]
      }
      default: {
        if (Array.isArray(value)) {
          return value.map((it) => ({
            value: String(it),
            secondary: true,
          }))
        }
        if (typeof value === 'number') {
          return [
            {
              value: this.decimals.transform(value, '0.0-7'),
              accent: true,
            },
          ]
        }
        return [
          {
            value: String(value),
            accent: typeof value === 'number',
            info: typeof value === 'boolean',
            bold: typeof value === 'boolean',
          },
        ]
      }
    }
  }
}
