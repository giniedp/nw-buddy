import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, computed, inject } from '@angular/core'
import { EQUIP_SLOTS, EquipSlot } from '@nw-data/common'
import { GearsetStore, ItemInstance } from '~/data'
import { NwModule } from '~/nw'
import { GearCellSlotComponent } from './gear-cell-slot.component'

@Component({
  selector: 'nwb-gear-cell-slots-trophies',
  templateUrl: './gear-cell-slots-trophies.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, GearCellSlotComponent],
  host: {
    class: 'block',
    '[class.hidden]': 'isEmpty() && disabled',
    '[class.screenshot-hidden]': 'isEmpty()',
  },
})
export class GearCellSlotsTrophiesComponent {
  @Input()
  public hideTitle = false

  @Input()
  public disabled = false

  private store = inject(GearsetStore)

  protected trophySlots = EQUIP_SLOTS.filter((it) => it.itemType === 'Trophies')
  protected isEmpty = computed(() => {
    return areSlotsEmtpy(this.trophySlots, this.store.gearsetSlots())
  })
  protected displayTrophySlots = computed(() => {
    const gearSlots = this.store.gearsetSlots()
    const slots = [...this.trophySlots]
    slots.length = Math.max(...slots.map((it, index) => (gearSlots?.[it.id] ? index + 1 : 0))) + 1
    slots.length = Math.min(slots.length, 15)
    return slots
  })

  protected get gearset() {
    return this.store.gearset()
  }
}

function areSlotsEmtpy(slots: EquipSlot[], gearSlots: Record<string, string | ItemInstance>) {
  return !gearSlots || !slots || !slots.length || slots.every((it) => !gearSlots[it.id])
}
