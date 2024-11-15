import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgCircleExclamation, svgEllipsisVertical } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { TooltipModule } from '~/ui/tooltip'
import { PlatformService } from '~/utils/services/platform.service'
import { ItemDetailStore } from './item-detail.store'
import { PerkSlot } from './selectors'

@Component({
  standalone: true,
  selector: 'nwb-item-detail-perks',
  templateUrl: './item-detail-perks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, IconsModule, TooltipModule],
  host: {
    class: 'flex flex-col gap-1',
  },
})
export class ItemDetailPerksComponent {
  protected items$ = this.store.perkSlots$
  protected editable$ = toSignal(this.store.perkEditable$)

  protected trackByIndex = (i: number) => i
  protected iconEdit = svgEllipsisVertical
  protected iconWarn = svgCircleExclamation
  protected platform = inject(PlatformService)
  protected linksEnabled = computed(() => !this.editable$() && !this.platform.isEmbed)

  public constructor(private store: ItemDetailStore) {
    //
  }

  protected async editPerkClicked(slot: PerkSlot) {
    if (this.isSlotEditable(slot)) {
      this.store.perkEdit$.emit(slot)
    }
  }

  protected isSlotEditable(slot: PerkSlot) {
    return this.editable$() && !!slot?.editable
  }

  protected buildTextContext(perkId: string, gs: number, context: Record<string, any>) {
    return { itemId: perkId, gearScore: gs, ...(context || {}) }
  }
}
