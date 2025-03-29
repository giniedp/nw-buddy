import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, resource } from '@angular/core'
import { DATASHEETS } from '@nw-data/generated'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'

export interface StandingRow {
  Level: number
  UpkeepCost: number
  TradingPostLevel: number
  EarningCap: number
  NumberOfUpgradesRegressed: number
}

@Component({
  selector: 'nwb-territory-governance-table',
  templateUrl: './territory-governance-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [],
  imports: [CommonModule, NwModule],
  host: {
    class: 'blakc',
  },
})
export class TerritoryGovernanceTableComponent {
  private db = injectNwData()
  protected data = resource({
    loader: () => this.db.loadDatasheet(DATASHEETS.TerritoryUpkeepDefinition.TerritoryUpkeep),
  })
  protected territoriesMap = resource({
    loader: () => this.db.territoriesByIdMap(),
  })
  protected territories = computed(() => {
    const data = this.data.value()
    const territories = this.territoriesMap.value()
    if (!data?.length || !territories) {
      return []
    }
    return Object.keys(data[0])
      .filter((it) => it.startsWith('EarningsDistributionTID'))
      .map((it) => {
        const id = Number(it.replace('EarningsDistributionTID', ''))
        return territories.get(id)
      })
  })
}
