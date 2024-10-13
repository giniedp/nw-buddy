import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { ItemDetailStore } from './item-detail.store'
import { IconsModule } from '~/ui/icons'
import { svgCircleExclamation, svgEllipsisVertical, svgPen } from '~/ui/icons/svg'
import { PerkSlot } from './selectors'
import { TooltipModule } from '~/ui/tooltip'

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
