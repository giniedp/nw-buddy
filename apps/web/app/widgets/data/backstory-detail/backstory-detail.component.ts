import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, computed, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { getItemPerkInfos, getItemRarity, isHousingItem, isItemNamed, isMasterItem } from '@nw-data/common'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridModule } from '~/ui/property-grid'
import { TooltipModule } from '~/ui/tooltip'
import { InventoryItem } from '../backstory-table'
import { BackstoryDetailStore } from './backstory-detail.store'
import { BackstoryLootTreeComponent } from './backstory-loot-tree.component'

const BACKGROUND_IMAGES = {
  Faction1: 'url(assets/backstories/backstory_image_marauders.png)',
  Faction2: 'url(assets/backstories/backstory_image_covenant.png)',
  Faction3: 'url(assets/backstories/backstory_image_syndicate.png)',
  Default: 'url(assets/backstories/backstory_image_level.png)',
}

@Component({
  standalone: true,
  selector: 'nwb-backstory-detail',
  templateUrl: './backstory-detail.component.html',
  exportAs: 'detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    ItemFrameModule,
    PropertyGridModule,
    DecimalPipe,
    TooltipModule,
    IconsModule,
    BackstoryLootTreeComponent,
  ],
  providers: [DecimalPipe, BackstoryDetailStore],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class BackstoryDetailComponent {
  protected store = inject(BackstoryDetailStore)

  @Input()
  public set backstoryId(value: string) {
    this.store.patchState({ backstoryId: value })
  }

  public backstory = toSignal(this.store.backstory$)
  public backgroundImage = computed(() => {
    return BACKGROUND_IMAGES[this.backstory()?.FactionOverride] || BACKGROUND_IMAGES.Default
  })
  public inventoryItems = toSignal(this.store.inventoryItems$)

  protected itemRarity(item: InventoryItem) {
    if (!item.perks || isHousingItem(item.item)) {
      return getItemRarity(item.item)
    }
    const perkIds = getItemPerkInfos(item.item, item.perks)
      .map((it) => it.perkId)
      .filter((it) => !!it)
    return getItemRarity(item.item, perkIds)
  }

  protected itemNamed(item: InventoryItem) {
    return isMasterItem(item.item) && isItemNamed(item.item)
  }
}
