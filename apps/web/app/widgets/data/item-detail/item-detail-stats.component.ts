import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import {
  getItemStatsArmor,
  getItemStatsWeapon,
  getWeaponScaling,
  getWeaponScalingTiers,
  isItemArmor,
  isItemHeartGem,
  isItemJewelery,
  isItemWeapon,
} from '@nw-data/common'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgEllipsisVertical } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { resourceValue } from '~/utils'
import { ItemDetailStore } from './item-detail.store'
import { ItemEditorEventsService } from './item-editor-events.service'

@Component({
  selector: 'nwb-item-detail-stats',
  exportAs: 'itemDetailStats',
  templateUrl: 'item-detail-stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, OverlayModule, ItemFrameModule, IconsModule],
  host: {
    class: 'block relative',
    '[class.hidden]': 'isHidden()',
  },
})
export class ItemDetailStatsComponent {
  private db = injectNwData()
  private store = inject(ItemDetailStore)
  private events = inject(ItemEditorEventsService, { optional: true })

  protected isHidden = computed(() => {
    return !this.gsLabel() && !this.stats()?.length
  })

  protected gsLabel = this.store.itemGSLabel
  protected gsEditable = this.store.gsEditable
  private resource = resourceValue({
    keepPrevious: true,
    defaultValue: {
      weapon: null,
      armor: null,
      rune: null,
      tiers: [],
    },
    params: () => {
      return {
        item: this.store.item(),
      }
    },
    loader: async ({ params: { item } }) => {
      const ref = item?.ItemStatsRef
      const weapon = await this.db.weaponItemsById(ref)
      const armor = await this.db.armorItemsById(ref)
      const rune = await this.db.runeItemsById(ref)
      const tiers = await this.db.weaponTiersAll().then((list) => {
        const scaling = getWeaponScaling(item, weapon)
        return getWeaponScalingTiers(scaling, list)
      })
      return {
        weapon,
        armor,
        rune,
        tiers,
      }
    },
  })

  protected tiers = computed(() => this.resource()?.tiers)
  protected stats = computed(() => {
    if (!this.store.isLoaded()) {
      return null
    }
    const item = this.store.item()
    if (!isItemArmor(item) && !isItemHeartGem(item) && !isItemWeapon(item) && !isItemJewelery(item)) {
      return null
    }
    const armor = this.resource()?.armor
    const weapon = this.resource()?.weapon
    const rune = this.resource()?.rune
    const gearScore = this.store.itemGS()

    const attrValueSums = this.store.attrValueSums()
    const playerLevel = this.store.playerLevel()

    return [
      ...getItemStatsWeapon({
        item,
        stats: weapon || rune,
        gearScore,
        playerLevel,
        attrValueSums,
      }),
      ...getItemStatsArmor(item, armor, gearScore),
    ]
  })


  protected editIcon = svgEllipsisVertical

  protected onGearScoreEdit(e: MouseEvent) {
    if (this.gsEditable() && this.events) {
      this.events.editGearScore.next(e)
    }
  }
}
