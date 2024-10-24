import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { map } from 'rxjs'
import { NwDataService } from '~/data'
import { NwModule } from '~/nw'

export interface StandingRow {
  Level: number
  XPToLevel: number
  XPTotal: number
  Title: string
  XPReward: number
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
  selector: 'nwb-territory-standing-table',
  templateUrl: './territory-standing-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [],
  imports: [CommonModule, NwModule],
  host: {
    class: 'blakc',
  },
})
export class TerritoryStandingTableComponent {
  public data = this.db
    .useTable((it) => it.CategoricalProgressionRankData.Territory_Standing)
    .pipe(
      map((data) => {
        return data.map((node, i): StandingRow => {
          return {
            Level: node.Rank,
            XPToLevel: node.InfluenceCost,
            XPTotal: accumulate(data, 0, i, 'InfluenceCost'),
            Title: node.DisplayName,
            XPReward: node.XpReward,
          }
        })
      }),
    )

  public constructor(private db: NwDataService) {
    //
  }
}
