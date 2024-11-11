import { ChangeDetectionStrategy, Component } from '@angular/core'
import { from, map } from 'rxjs'
import { injectNwData } from '~/data'

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
  selector: 'nwb-standing-table',
  templateUrl: './standing-table.component.html',
  styleUrls: ['./standing-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [],
})
export class StandingTableComponent {
  private db = injectNwData()
  public data = from(this.db.categoricalRankTerritoryStanding()).pipe(
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
}
