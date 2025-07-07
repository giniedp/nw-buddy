import { CdkMenuModule } from '@angular/cdk/menu'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, TemplateRef, computed, inject, input, output } from '@angular/core'
import { EquipSlot, EquipSlotId } from '@nw-data/common'
import { GearsetRecord, GearsetSlotStore } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgEllipsisVertical, svgPlus } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { selectSignal } from '~/utils'
import { ItemDetailModule } from '~/widgets/data/item-detail'

export interface GearsetSquareSlotState {
  slot: EquipSlot
  gearset: GearsetRecord
}

@Component({
  selector: 'nwb-gearset-square-slot',
  templateUrl: './square-slot.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemDetailModule, IconsModule, CdkMenuModule, TooltipModule],
  providers: [GearsetSlotStore],
  host: {
    class: 'inline-block rounded-md overflow-clip',
  },
})
export class GersetSquareSlotComponent {
  protected store = inject(GearsetSlotStore)
  public readonly slotId = input<EquipSlotId>()
  public readonly gearset = input<GearsetRecord>()

  public disabled = input(false)
  public pickItem = output<EquipSlotId>()
  public menuTemplate = input<TemplateRef<any>>()

  protected iconPlus = svgPlus
  protected iconMenu = svgEllipsisVertical

  public constructor() {
    this.store.connect(
      computed(() => {
        return {
          gearset: this.gearset(),
          slotId: this.slotId(),
        }
      }),
    )
  }

  protected pickItemClicked() {
    if (!this.disabled()) {
      this.pickItem.emit(this.slotId())
    }
  }
}
