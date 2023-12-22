import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { LootLimitDetailStore } from './loot-limit-detail.store'
import { PropertyGridModule } from '~/ui/property-grid'
import { selectSignal } from '~/utils'
import { getItemId } from '@nw-data/common'

@Component({
  standalone: true,
  selector: 'nwb-loot-limit-detail',
  templateUrl: './loot-limit-detail.component.html',
  exportAs: 'detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, PropertyGridModule],
  providers: [DecimalPipe, LootLimitDetailStore],
  host: {
    class: 'block rounded-md overflow-clip bg-black p-2 border border-base-100' ,
  },
})
export class LootLimitDetailComponent {
  protected store = inject(LootLimitDetailStore)

  @Input()
  public set limitId(value: string) {
    this.store.patchState({ limitId: value })
  }

  public readonly lootLimit = selectSignal(this.store.lootLimit$)
  public readonly props = toSignal(this.store.props$)
  public readonly item = selectSignal(this.store.item$)
  public readonly buckets = selectSignal(this.store.buckets$)
  public readonly lootTables = selectSignal(this.store.lootTables$)
  public readonly eventsBeforeLimit = selectSignal(this.store.eventsWithLimit$)
  public readonly eventsAfterLimit = selectSignal(this.store.eventsAfterLimit$)
}
