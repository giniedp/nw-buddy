import { DecimalPipe } from '@angular/common'
import { Component, computed, inject } from '@angular/core'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { PaginationModule } from '~/ui/pagination'
import { TooltipModule } from '~/ui/tooltip'
import { UmbralCalculatorStore } from './umbral-calculator.store'

@Component({
  selector: 'nwb-umbral-upgrades',
  templateUrl: './umbral-upgrades.component.html',
  imports: [IconsModule, NwModule, DecimalPipe, PaginationModule, TooltipModule],
})
export class UmbralUpgradesComponent {
  protected store = inject(UmbralCalculatorStore)
  protected upgrades = computed(() => {
    if (this.store.grouped()) {
      return this.store.upgradesGrouped()
    } else {
      return this.store.upgrades()
    }
  })
  protected applyUpgrade(score: number) {
    this.store.applyUpgrades(score)
  }
}
