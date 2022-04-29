import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, Input, OnChanges } from '@angular/core'
import { GridOptions } from 'ag-grid-community'
import { Umbralgsupgrades } from '@nw-data/types'
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Subject, takeUntil } from 'rxjs'
import { NwDataService, NwService } from '~/core/nw'

function accumulate<T>(data: T[], startIndex: number, endIndex: number, key: keyof T) {
  let result = 0
  for (let i = startIndex; i <= endIndex; i++) {
    result += (data[i] as any) [key] as number
  }
  return result
}

@Component({
  selector: 'nwb-umbral-table',
  templateUrl: './umbral-table.component.html',
  styleUrls: ['./umbral-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UmbralTableComponent implements OnInit, OnDestroy, OnChanges {

  @Input()
  public gsMin: number = null

  @Input()
  public gsMax: number = null

  public limit: number
  public data: Umbralgsupgrades[]
  public index: number
  private destroy$ = new Subject()
  private gsMin$ = new BehaviorSubject(this.gsMin)
  private gsMax$ = new BehaviorSubject(this.gsMax)
  private index$ = new BehaviorSubject(0)

  public constructor(private nw: NwService, private cdRef: ChangeDetectorRef) {}

  public async ngOnInit() {

    combineLatest({
      min: this.gsMin$,
      max: this.gsMax$,
      index: this.index$,
      data: this.nw.db.data.datatablesUmbralgsupgrades()
    }).pipe(map(({ min, max, index, data }) => {
      this.index = index
      if (min != null) {
        data = data.filter((it) => it.Level >= min)
      }
      if (max != null) {
        data = data.filter((it) => it.Level <= max)
      }
      return data.map((node, i) => {
        let iStart = index || 0
        let iEnd = i
        return {
          ...node,
          total: accumulate(data, iStart, iEnd, 'RequiredItemQuantity')
        }
      })
    }))
    .pipe(takeUntil(this.destroy$))
    .subscribe((data) => {
      this.data = data
      this.limit = Math.max(...data.map((it) => it.Level)) + 1
      this.cdRef.markForCheck()
    })
  }

  public ngOnChanges(): void {
    this.gsMax$.next(this.gsMax)
    this.gsMin$.next(this.gsMin)
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  public setIndex(value: number) {
    this.index$.next(value)
  }
}
