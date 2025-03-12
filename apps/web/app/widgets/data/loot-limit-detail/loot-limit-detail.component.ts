import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridModule } from '~/ui/property-grid'
import { LootLimitDetailStore } from './loot-limit-detail.store'

@Component({
  selector: 'nwb-loot-limit-detail',
  templateUrl: './loot-limit-detail.component.html',
  exportAs: 'detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, PropertyGridModule],
  providers: [DecimalPipe, LootLimitDetailStore],
  host: {
    class: 'block rounded-md overflow-clip bg-black p-3 border border-base-100',
  },
})
export class LootLimitDetailComponent {
  protected store = inject(LootLimitDetailStore)

  @Input()
  public set limitId(value: string) {
    this.store.load(value)
  }

  public readonly lootLimit = this.store.lootLimit
  public readonly props = this.store.props
  public readonly item = this.store.item
  public readonly buckets = this.store.buckets
  public readonly lootTables = this.store.lootTablesIds
  public readonly eventsBeforeLimit = this.store.eventsWithLimit
  public readonly eventsAfterLimit = this.store.eventsAfterLimit
}
