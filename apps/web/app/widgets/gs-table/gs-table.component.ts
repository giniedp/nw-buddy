import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, Input, OnChanges, SimpleChanges } from '@angular/core'
import { GridOptions } from 'ag-grid-community'
import { Umbralgsupgrades, Xpamountsbylevel } from '@nw-data/types'
import { BehaviorSubject, combineLatest, distinctUntilChanged, firstValueFrom, map, Subject, switchMap, takeUntil } from 'rxjs'
import { NwDataService } from '~/core/nw'

function accumulate<T>(data: T[], startIndex: number, endIndex: number, key: keyof T) {
  let result = 0
  for (let i = startIndex; i <= endIndex; i++) {
    result += (data[i] as any) [key] as number
  }
  return result
}

@Component({
  selector: 'nwb-gs-table',
  templateUrl: './gs-table.component.html',
  styleUrls: ['./gs-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GsTableComponent implements OnInit, OnDestroy, OnChanges {

  @Input()
  public gsMin: number = null

  @Input()
  public gsMax: number = null

  public data: Umbralgsupgrades[]

  public gridOptions: GridOptions = {
    rowSelection: 'single',
    onSelectionChanged: (it) => {
      it.api.refreshCells()
    },
    columnDefs: [
      {
        field: 'Level',
        width: 80,
        cellStyle: {
          'text-align': 'right'
        },
      },
      {
        headerName: 'to next',
        field: 'RequiredItemQuantity',
        cellStyle: {
          'text-align': 'right'
        },
        width: 80
      },
      {
        headerName: 'to end',
        cellStyle: {
          'text-align': 'right'
        },
        width: 80,
        valueGetter: (it) => {
          let iStart = 0
          let iEnd = it.node.rowIndex

          const selection = it.api.getSelectedNodes()?.[0]
          if (selection) {
            iStart = selection.rowIndex
            iEnd = it.node.rowIndex
          }
          return accumulate(this.data, iStart, iEnd, 'RequiredItemQuantity')
        },
      },

    ],
  }

  private destroy$ = new Subject()
  private gsMin$ = new BehaviorSubject(this.gsMin)
  private gsMax$ = new BehaviorSubject(this.gsMax)

  public constructor(private nw: NwDataService, private cdRef: ChangeDetectorRef) {}

  public async ngOnInit() {
    const gsMin$ = this.gsMin$.pipe(distinctUntilChanged())
    const gsMax$ = this.gsMax$.pipe(distinctUntilChanged())

    combineLatest([this.nw.datatablesUmbralgsupgrades(), gsMin$, gsMax$])
      .pipe(map(([data, min, max]) => {
        if (min != null) {
          data = data.filter((it) => it.Level >= min)
        }
        if (max != null) {
          data = data.filter((it) => it.Level <= max)
        }
        return data
      }))
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.data = data
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

}
