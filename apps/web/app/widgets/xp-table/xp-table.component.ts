import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core'
import { BehaviorSubject, combineLatest, map, Subject, takeUntil } from 'rxjs'
import { NwService } from '~/core/nw'

function accumulate<T>(data: T[], startIndex: number, endIndex: number, key: keyof T) {
  let result = 0
  for (let i = startIndex; i <= endIndex; i++) {
    result += (data[i] as any) [key] as number
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
  selector: 'nwb-xp-table',
  templateUrl: './xp-table.component.html',
  styleUrls: ['./xp-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class XpTableComponent implements OnInit, OnDestroy {

  public limit: number
  public data: LevelingRow[]
  public index: number
  private destroy$ = new Subject()

  public constructor(private nw: NwService, private cdRef: ChangeDetectorRef) {}

  public async ngOnInit() {

    combineLatest({
      data: this.nw.db.data.xpamountsbylevel()
    }).pipe(map(({ data }) => {
      return data.map((node, i): LevelingRow => {
        return {
          Level: node['Level Number'],
          XPToLevel: node.XPToLevel,
          XPTotal: accumulate(data, 0, i, 'XPToLevel'),
          AttributePoints: node.AttributePoints,
          AttributePointsTotal: accumulate(data, 0, i, 'AttributePoints'),
          AttributeRespecCost: node.AttributeRespecCost
        }
      })
    }))
    .pipe(takeUntil(this.destroy$))
    .subscribe((data) => {
      this.data = data
      this.limit = Math.max(...data.map((it) => it['Level Number'])) + 1
      this.cdRef.markForCheck()
    })
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
