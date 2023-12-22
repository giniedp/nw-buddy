import { DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { GameEvent } from '@nw-data/generated'
import { PropertyGridCell, PropertyGridModule } from '~/ui/property-grid'
import { GameEventDetailRewardsComponent } from './game-event-detail-rewards.component'
import { GameEventDetailStore } from './game-event-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-game-event-detail',
  templateUrl: './game-event-detail.component.html',
  exportAs: 'detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PropertyGridModule, DecimalPipe, GameEventDetailRewardsComponent],
  providers: [DecimalPipe, GameEventDetailStore],
  host: {
    class: 'block rounded-md overflow-clip bg-black p-3 border border-base-100',
  },
})
export class GameEventDetailComponent {
  public readonly store = inject(GameEventDetailStore)
  protected decimals = inject(DecimalPipe)

  public readonly props = toSignal(this.store.properties$)
  public readonly rewards = toSignal(this.store.rewards$)
  public readonly lootTableId = toSignal(this.store.lootTableId$)

  @Input()
  public set eventId(value: string) {
    this.store.patchState({ eventId: value })
  }

  public formatValue = (value: any, key: keyof GameEvent): PropertyGridCell | PropertyGridCell[] => {
    switch (key) {
      case 'EventID': {
        return [
          {
            value: String(value),
            accent: true,
            routerLink: ['/game-events/table', value],
          },
        ]
      }
      case 'LootLimitReachedGameEventId':
      case 'LootLimitId': {
        return [
          {
            value: String(value),
            accent: true,
            routerLink: ['/loot-limits/table', value],
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
              routerLink: ['/loot/table', id.replace('[LTID]', '')],
            },
          ]
        }
        if (id.includes('HousingItem')) {
          return [
            {
              value: value,
              accent: true,
              routerLink: ['/housing/table', value],
            },
          ]
        }
        return [
          {
            value: value,
            accent: true,
            routerLink: ['/items/table', value],
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
