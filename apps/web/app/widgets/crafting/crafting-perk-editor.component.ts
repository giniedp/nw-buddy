import { Component, inject } from '@angular/core'
import { CraftingCalculatorStore } from './crafting-calculator.store'

@Component({
  standalone: true,
  selector: 'nwb-crafting-perk-editor',
  template: ``,
})
export class CraftingPerkEditor {
  private store = inject(CraftingCalculatorStore)

}
