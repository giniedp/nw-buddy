import { computed, Directive, inject, resource } from '@angular/core'
import { injectNwData } from '~/data'
import { Umbralgsupgrades } from './calculator'
import { UmbralCalculatorStore } from './umbral-calculator.store'

@Directive({
  selector: '[nwbUmbralCalculator]',
  providers: [UmbralCalculatorStore],
})
export class UmbralCalculatorDirective {
  private db = injectNwData()
  private upgradeResource = resource({
    loader: async (): Promise<Umbralgsupgrades[]> => {
      return []
    }
  })
  private upgradeCosts = computed((): Umbralgsupgrades[] => {
    if (this.upgradeResource.hasValue()) {
      return this.upgradeResource.value().map((it) => {
        return {
          level: it.level,
          cost: it.cost,
        }
      })
    }
    return []
  })

  private store = inject(UmbralCalculatorStore)

  public constructor() {
    this.store.connectCosts(this.upgradeCosts)
  }
}
