import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { RouterModule } from '@angular/router'
import { getItemId, isHousingItem, isItemArmor, isItemJewelery, isItemWeapon, isMasterItem } from '@nw-data/common'
import { NwLinkService, NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { ItemTrackerModule } from '../../item-tracker'
import { ItemDetailStore } from './item-detail.store'

@Component({
  selector: 'nwb-item-detail-header',
  templateUrl: './item-detail-header.component.html',
  styleUrls: ['./item-detail-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, RouterModule, ItemTrackerModule, ItemFrameModule],
  host: {
    class: 'nw-item-header relative flex flex-col text-shadow-sm shadow-black',
    '[class.bg-base-300]': 'showSkeleton()',
    '[class.named]': 'isNamed()',
    '[class.artifact]': 'isArtifact()',
    '[class.nw-item-rarity-common]': '!showSkeleton() && (rarity() === "common")',
    '[class.nw-item-rarity-uncommon]': 'rarity() === "uncommon"',
    '[class.nw-item-rarity-rare]': 'rarity() === "rare"',
    '[class.nw-item-rarity-epic]': 'rarity() === "epic"',
    '[class.nw-item-rarity-legendary]': 'rarity() === "legendary"',
    '[class.nw-item-rarity-artifact]': 'rarity() === "artifact"',
  },
})
export class ItemDetailHeaderComponent {
  protected store = inject(ItemDetailStore)
  private link = inject(NwLinkService)

  public enableInfoLink = input(false)
  public enableLink = input(false)
  public enableTracker = input(false)
  public disableContent = input(false)
  public size = input<'xs' | 'sm' | 'md' | 'lg'>('md')

  protected name = this.store.fullName
  protected icon = this.store.icon
  protected isNamed = this.store.isNamed
  protected isArtifact = this.store.isArtifact
  protected rarity = this.store.rarity
  protected rarityName = this.store.rarityLabel
  protected typeName = this.store.typeName
  protected sourceLabel = this.store.sourceLabel
  protected tierLabel = this.store.tierLabel
  protected record = this.store.record
  protected recordId = this.store.recordId
  protected recordLink = computed(() => {
    const record = this.record()
    if (record) {
      return this.link.resourceLink({
        type: isHousingItem(record) ? 'housing' : 'item',
        id: getItemId(record),
      })
    }
    return null
  })
  protected showSkeleton = computed(() => (!this.store.record() && this.store.isLoading()) || !this.store.isLoaded())
  protected showMissing = computed(() => !this.store.record() && !this.store.isLoading() && this.store.isLoaded())
}
