import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, HostBinding, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { getItemStatsArmor, getItemStatsWeapon } from '@nw-data/common'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgEllipsisVertical } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { apiResource } from '~/utils'
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
  private resource = apiResource({
    request: () => this.store.item()?.ItemStatsRef,
    loader: async ({ request }) => {
      return {
        weapon: await this.db.weaponItemsById(request),
        armor: await this.db.armorItemsById(request),
        rune: await this.db.runeItemsById(request),
      }
    },
  })

  protected stats = computed(() => {
    if (!this.store.isLoaded() || !this.resource.isLoaded()) {
      return null
    }
    const item = this.store.item()
    const armor = this.resource.value()?.armor
    const weapon = this.resource.value()?.weapon
    const rune = this.resource.value()?.rune
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
