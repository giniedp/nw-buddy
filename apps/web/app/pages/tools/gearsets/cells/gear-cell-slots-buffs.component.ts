import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, computed, inject } from '@angular/core'
import { EQUIP_SLOTS, EquipSlot } from '@nw-data/common'
import { GearsetStore, ItemInstance } from '~/data'
import { NwModule } from '~/nw'
import { GearCellSlotComponent } from './gear-cell-slot.component'

@Component({
  selector: 'nwb-gear-cell-slots-buffs',
  templateUrl: './gear-cell-slots-buffs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, GearCellSlotComponent],
  host: {
    class: 'block',
    '[class.hidden]': 'isEmpty() && disabled',
    '[class.screenshot-hidden]': 'isEmpty()',
  },
})
export class GearCellSlotsBuffsComponent {
  @Input()
  public hideTitle = false

  @Input()
  public disabled = false

  private store = inject(GearsetStore)
  protected ammoSlots = EQUIP_SLOTS.filter((it) => it.itemType === 'Ammo')
  protected buffSlots = EQUIP_SLOTS.filter((it) => it.id.startsWith('buff'))
  protected isEmpty = computed(() => {
    const slots = this.store.gearsetSlots()
    return areSlotsEmtpy(this.ammoSlots, slots) && areSlotsEmtpy(this.buffSlots, slots)
  })

  protected get gearset() {
    return this.store.gearset()
  }
}

function areSlotsEmtpy(slots: EquipSlot[], gearSlots: Record<string, string | ItemInstance>) {
  return !gearSlots || !slots || !slots.length || slots.every((it) => !gearSlots[it.id])
}
