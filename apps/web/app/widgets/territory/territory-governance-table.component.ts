import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { combineLatest, defer, map } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { shareReplayRefCount } from '~/utils'

export interface StandingRow {
  Level: number
  UpkeepCost: number
  TradingPostLevel: number
  EarningCap: number
  NumberOfUpgradesRegressed: number
}

function accumulate<T>(data: T[], startIndex: number, endIndex: number, key: keyof T) {
  let result = 0
  for (let i = startIndex; i <= endIndex; i++) {
    result += (data[i] as any)[key] as number
  }
  return result
}

@Component({
  standalone: true,
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
  protected data$ = defer(() => this.db.data.territorygovernance()).pipe(shareReplayRefCount(1))
  protected territries$ = defer(() =>
    combineLatest({
      data: this.data$,
      territories: this.db.territoriesMap,
    })
  ).pipe(
    map(({ data, territories }) => {
      return Object.keys(data[0])
        .filter((it) => it.startsWith('EarningsDistributionTID'))
        .map((it) => {
          const id = Number(it.replace('EarningsDistributionTID', ''))
          return territories.get(id)
        })
    })
  )

  public constructor(private db: NwDbService) {
    //
  }
}
