import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, computed, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { RouterModule } from '@angular/router'
import { getItemId, isHousingItem, isItemArmor, isItemJewelery, isItemWeapon, isMasterItem } from '@nw-data/common'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { ItemTrackerModule } from '../../item-tracker'
import { ItemDetailStore } from './item-detail.store'
import { map } from 'rxjs'
import { selectSignal } from '~/utils'

@Component({
  standalone: true,
  selector: 'nwb-item-detail-header',
  templateUrl: './item-detail-header.component.html',
  styleUrls: ['./item-detail-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, RouterModule, ItemTrackerModule, ItemFrameModule],
  host: {
    class: 'nw-item-header relative flex flex-col text-shadow-sm shadow-black',
    '[class.bg-base-300]': 'isLoading()',
    '[class.named]': 'isNamed()',
    '[class.artifact]': 'isArtifact()',
    '[class.nw-item-rarity-common]': '!isLoading() && (rarity() === "common")',
    '[class.nw-item-rarity-uncommon]': 'rarity() === "uncommon"',
    '[class.nw-item-rarity-rare]': 'rarity() === "rare"',
    '[class.nw-item-rarity-epic]': 'rarity() === "epic"',
    '[class.nw-item-rarity-legendary]': 'rarity() === "legendary"',
    '[class.nw-item-rarity-artifact]': 'rarity() === "artifact"',
  },
})
export class ItemDetailHeaderComponent {
  protected store = inject(ItemDetailStore)

  @Input()
  public enableInfoLink: boolean

  @Input()
  public enableLink: boolean

  @Input()
  public enableTracker: boolean

  @Input()
  public disableContent: boolean

  @Input()
  public iconOverride: ItemDefinitionMaster | Housingitems

  @Input()
  public size: 'xs' | 'sm' | 'md' | 'lg' = 'md'

  protected name = selectSignal({
    name: this.store.name$,
    prefix: this.store.namePrefix$,
    suffix: this.store.nameSuffix$,
  }, ({ prefix, name, suffix }) => {
    return [prefix, name, suffix].filter((it) => !!it)
  })
  protected icon = toSignal(this.store.icon$)
  protected isNamed = toSignal(this.store.isNamed$)
  protected isArtifact = toSignal(this.store.isArtifact$)
  protected rarity = toSignal(this.store.finalRarity$)
  protected rarityName = toSignal(this.store.finalRarityName$)
  protected typeName = toSignal(this.store.typeName$)
  protected sourceLabel = toSignal(this.store.sourceLabel$)
  protected tierLabel = toSignal(this.store.tierLabel$)
  protected record = toSignal(this.store.entity$)
  protected recordId = toSignal(this.store.recordId$)
  protected recordLink = computed(() => {
    const record = this.record()
    if (record) {
      return ['/', isHousingItem(record) ? 'housing' : 'items', 'table', getItemId(record)]
    }
    return null
  })
  protected isMissing = toSignal(this.store.isMissing$)
  protected isLoading = toSignal(this.store.entity$.pipe(map(() => false)), { initialValue: true })

  protected enableGsTracker = computed(() => {
    const record = this.record()
    if (!record || !isMasterItem(record)) {
      return false
    }
    return isItemWeapon(record) || isItemArmor(record) || isItemJewelery(record)
  })
}
