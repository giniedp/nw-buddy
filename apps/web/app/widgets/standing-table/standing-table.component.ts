import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef } from '@angular/core'
import { map, Subject, takeUntil } from 'rxjs'
import { NwService } from '~/core/nw'

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
})
export class StandingTableComponent implements OnInit, OnDestroy {
  public data: StandingRow[]
  private destroy$ = new Subject()

  public constructor(private nw: NwService, private cdRef: ChangeDetectorRef) {}

  public async ngOnInit() {
    this.nw.db.data
      .territoryStanding()
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
        })
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.data = data
        this.cdRef.markForCheck()
      })
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
