import { Component, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { EquipSlotId } from '@nw-data/common'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { UmbralCalculatorStore } from './umbral-calculator.store'

@Component({
  selector: 'nwb-umbral-slots',
  templateUrl: './umbral-slots.component.html',
  imports: [IconsModule, NwModule, FormsModule],
})
export class UmbralSlotsComponent {
  private store = inject(UmbralCalculatorStore)

  protected items = this.store.items
  protected bank = this.store.bank
  protected upgrades = this.store.upgrades
  protected maxLevel = this.store.maxLevel
  protected setGearScore(id: EquipSlotId, value: number) {
    this.store.setGearScore(id, value)
  }
  protected setBank(value: number) {
    this.store.setBank(value)
  }
  protected slotFinalGs(slot: EquipSlotId) {
    return this.store.slotFinalGs(slot)
  }
}
