import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { Subject, combineLatest, map, takeUntil } from 'rxjs'
import { NwDataService } from '~/data'
import { selectSignal } from '~/utils'

function accumulate<T>(data: T[], startIndex: number, endIndex: number, key: keyof T) {
  let result = 0
  for (let i = startIndex; i <= endIndex; i++) {
    result += (data[i] as any)[key] as number
  }
  return result
}

export interface LevelingRow {
  Level: number
  XPToLevel: number
  XPTotal: number
  AttributePoints: number
  AttributePointsTotal: number
  AttributeRespecCost: number
}

@Component({
  standalone: true,
  selector: 'nwb-xp-table',
  templateUrl: './xp-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  host: {
    class: 'block',
  },
})
export class XpTableComponent {

  protected data = selectSignal(inject(NwDataService).xpAmounts, (data) => {
    return (data || []).map((row, i): LevelingRow => {
      return {
        Level: row['Level Number'] + 1,
        XPToLevel: row.XPToLevel - data[i > 0 ? i - 1 : i]['XPToLevel'] || 0,
        XPTotal: row.XPToLevel || 0,
        AttributePoints: row.AttributePoints,
        AttributePointsTotal: accumulate(data, 0, i, 'AttributePoints'),
        AttributeRespecCost: row.AttributeRespecCost,
      }
    })
  })

}
