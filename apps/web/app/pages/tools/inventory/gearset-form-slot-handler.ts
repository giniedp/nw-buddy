import { EventEmitter, Injectable, inject } from '@angular/core'
import { EquipSlot } from '@nw-data/common'
import { ItemInstanceRecord, ItemInstanceRow } from '~/data'
import { DnDService } from '~/utils/services/dnd.service'
import { GersetLoadoutSlotComponent, LoadoutSlotEventHandler } from '~/widgets/data/gearset-detail'

export interface ItemDroppedEvent {
  slot: EquipSlot
  item: ItemInstanceRecord
}

@Injectable()
export class GearsetFormSlotHandler extends LoadoutSlotEventHandler {
  public itemDropped = new EventEmitter<ItemDroppedEvent>()

  private dnd = inject(DnDService)

  public override click(e: MouseEvent, component: GersetLoadoutSlotComponent): void {}

  public override dragEnter(e: DragEvent, component: GersetLoadoutSlotComponent): void {
    const data = this.dnd.data
    if (isApplicable(data, component.getSlot())) {
      component.patchState({ dragState: 'success' })
    } else {
      component.patchState({ dragState: 'error' })
    }
  }

  public override dragLeave(e: DragEvent, component: GersetLoadoutSlotComponent): void {
    component.patchState({ dragState: 'idle' })
  }
  override dragOver(e: DragEvent, component: GersetLoadoutSlotComponent): void {
    const data = this.dnd.data as ItemInstanceRow
    if (isApplicable(data, component.getSlot())) {
      e.dataTransfer.dropEffect = 'link'
      component.patchState({ dragState: 'success' })
    } else {
      e.dataTransfer.dropEffect = 'none'
      component.patchState({ dragState: 'error' })
    }
    e.preventDefault()
  }
  override dragDrop(e: DragEvent, component: GersetLoadoutSlotComponent): void {
    component.patchState({ dragState: 'idle' })
    const data = this.dnd.data as ItemInstanceRow
    if (isApplicable(data, component.getSlot())) {
      this.itemDropped.emit({
        slot: component.getSlot(),
        item: data.record,
      })
    }
  }
}
function isApplicable(data: ItemInstanceRow, slot: EquipSlot) {
  if (!data || !data.item || !data.item.ItemClass || !data.record?.id) {
    return false
  }
  return data.item.ItemClass.some((it) => it === slot.itemType)
}
