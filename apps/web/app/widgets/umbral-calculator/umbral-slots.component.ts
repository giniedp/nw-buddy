import { Component, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { EquipSlotId } from '@nw-data/common'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgDollarSign, svgLock, svgLockOpen } from '~/ui/icons/svg'
import { TooltipDirective } from '~/ui/tooltip'
import { UmbralCalculatorStore } from './umbral-calculator.store'

@Component({
  selector: 'nwb-umbral-slots',
  templateUrl: './umbral-slots.component.html',
  imports: [IconsModule, NwModule, FormsModule, TooltipDirective],
})
export class UmbralSlotsComponent {
  private store = inject(UmbralCalculatorStore)

  protected items = this.store.items
  protected bank = this.store.bank
  protected upgrades = this.store.upgrades
  protected maxLevel = this.store.maxLevel
  protected iconLock = svgLock
  protected iconLockOpen = svgLockOpen
  protected iconPlus = svgDollarSign

  protected setGearScore(id: EquipSlotId, value: number) {
    this.store.setGearScore(id, value)
  }
  protected setGearLocked(id: EquipSlotId, locked: boolean) {
    this.store.setGearLocked(id, locked)
  }
  protected setBank(value: number) {
    this.store.setBank(value)
  }
  protected slotFinalGs(slot: EquipSlotId) {
    return this.store.slotFinalGs(slot)
  }
  protected slotFinalCosts(slot: EquipSlotId) {
    return this.store.slotFinalCosts(slot)
  }
}
