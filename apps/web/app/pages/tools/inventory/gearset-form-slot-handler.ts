import { EventEmitter, Injectable, inject } from '@angular/core'
import { EquipSlot, getEquipSlotForId } from '@nw-data/common'
import { ItemInstanceRecord, ItemInstanceRow } from '~/data'
import { DnDService } from '~/utils/services/dnd.service'
import { GearsetLoadoutSlotComponent, LoadoutSlotEventHandler } from '~/widgets/data/gearset-detail'

export interface ItemDroppedEvent {
  slot: EquipSlot
  item: ItemInstanceRecord
}

@Injectable()
export class GearsetFormSlotHandler extends LoadoutSlotEventHandler {
  public itemDropped = new EventEmitter<ItemDroppedEvent>()

  private dnd = inject(DnDService)

  public override click(e: MouseEvent, component: GearsetLoadoutSlotComponent): void {}

  public override dragEnter(e: DragEvent, component: GearsetLoadoutSlotComponent): void {
    const data = this.dnd.data
    const slot = getEquipSlotForId(component.slotId())
    if (isApplicable(data, slot)) {
      component.dragState.set('success')
    } else {
      component.dragState.set('error')
    }
  }

  public override dragLeave(e: DragEvent, component: GearsetLoadoutSlotComponent): void {
    component.dragState.set('idle')
  }
  override dragOver(e: DragEvent, component: GearsetLoadoutSlotComponent): void {
    const data = this.dnd.data as ItemInstanceRow
    const slot = getEquipSlotForId(component.slotId())
    if (isApplicable(data, slot)) {
      e.dataTransfer.dropEffect = 'link'
      component.dragState.set('success')
    } else {
      e.dataTransfer.dropEffect = 'none'
      component.dragState.set('error')
    }
    e.preventDefault()
  }
  override dragDrop(e: DragEvent, component: GearsetLoadoutSlotComponent): void {
    component.dragState.set('idle')
    const slot = getEquipSlotForId(component.slotId())
    const data = this.dnd.data as ItemInstanceRow
    if (isApplicable(data, slot)) {
      this.itemDropped.emit({
        slot: slot,
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
