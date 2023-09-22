import { Injectable, NgIterable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { TranslateService } from '~/i18n'
import { VirtualGridCellContext } from './virtual-grid-cell.directive'
import { QuickFilterGetterFn } from './virtual-grid-options'
import { VirtualGridRowContext } from './virtual-grid-row.directive'
import { isEqual } from 'lodash'

export interface VirtualGridState<T> {
  data: T[]
  selection?: Array<string | number>
  identifyBy?: (it: T) => string | number
  /**
   * The quickfilter text
   */
  quickfilter?: string
  /**
   * The fixed item height
   */
  itemHeight: number
  /**
   * The maximum item width
   */
  itemWidth: number | [number, number]
  /**
   * Minimum number of columns
   */
  colCount: number | [number, number]
  /**
   * Total available width
   */
  size: number
  /**
   *
   */
  ngClass: string | string[]
  /**
   *
   */
  quickfilterGetter?: QuickFilterGetterFn<T>
}

@Injectable()
export class VirtualGridStore<T> extends ComponentStore<VirtualGridState<T>> {
  public readonly identifyBy$ = this.selectSignal(({ identifyBy }) => identifyBy)
  public readonly quickfilter$ = this.select(({ quickfilter }) => quickfilter)
  public readonly itemSize$ = this.select(({ itemHeight }) => itemHeight)
  public readonly ngClass$ = this.select(({ ngClass }) => ngClass)
  public readonly quickfilterGetter$ = this.select(({ quickfilterGetter }) => quickfilterGetter)
  public readonly data$ = this.select(({ data }) => data || [])
  public readonly selection$ = this.select<Array<string | number>>(
    ({ selection }) => {
      return selection || []
    },
    {
      equal: isEqual,
    }
  )
  public readonly selection = this.selectSignal(({ selection }) => selection || [])
  public readonly filteredData$ = this.select(
    this.data$,
    this.quickfilter$,
    this.quickfilterGetter$,
    (list, query, getter) => {
      if (!getter || !query || !list?.length) {
        return list
      }
      const translate = (text: string) => this.tl8.get(text)
      return list.filter((it) => {
        const text = getter(it, translate) || ''
        return text.toLowerCase().includes(query)
      })
    }
  )

  public readonly colCount$ = this.select(this.state$, selectColumnCount)
  public readonly rows$ = this.select(this.filteredData$, this.colCount$, selectRows, {
    debounce: true,
  })
  public readonly rowCount$ = this.select(this.rows$, (it) => it.length)
  protected trackBy = (i: number) => i

  public constructor(private tl8: TranslateService) {
    super({
      data: [],
      size: null,
      itemHeight: 100,
      itemWidth: 100,
      colCount: [1, null],
      ngClass: null,
    })
  }

  public ngOnInit(): void {}
}

function selectColumnCount({
  size,
  itemWidth,
  colCount,
}: Pick<VirtualGridState<any>, 'size' | 'itemWidth' | 'colCount'>) {
  let [minColumns, maxColumns] = decodeMinmax(colCount)

  if (!minColumns) {
    minColumns = 1
  }
  if (!size || size < 0) {
    return minColumns
  }

  let [minWidth, maxWidth] = decodeMinmax(itemWidth)
  // TODO: research how max width can be used
  if (!minWidth) {
    minWidth = Math.ceil(size / minColumns)
  }

  let cols = Math.floor(size / minWidth)
  return Math.min(Math.max(cols, minColumns, maxColumns || minColumns))
}

function decodeMinmax(value: number | [number, number]) {
  if (typeof value === 'number') {
    return [value, null]
  }
  return value || [null, null]
}

function selectRows<T>(data: NgIterable<T>, columns: number) {
  const rows: T[][] = []
  let row: T[]
  let i = 0
  for (const item of data) {
    if (!row || row.length === columns) {
      i = 0
      row = []
      rows.push(row)
    }
    i++
    row.push(item)
  }
  while (i > 0 && i < columns) {
    i++
    row.push(null)
  }
  return rows.map((row, i): VirtualGridRowContext<T> => {
    return {
      count: rows.length,
      index: i,
      even: i % 2 === 0,
      odd: i % 2 !== 0,
      first: i === 0,
      last: i === rows.length - 1,
      $implicit: row.map((cell, j): VirtualGridCellContext<T> => {
        return {
          $implicit: cell,
          count: row.length,
          index: j,
          even: j % 2 === 0,
          odd: j % 2 !== 0,
          first: j === 0,
          last: j === row.length - 1,
        }
      }),
    }
  })
}
