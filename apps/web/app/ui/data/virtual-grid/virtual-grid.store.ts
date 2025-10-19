import { computed, inject, Injectable, NgIterable } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { patchState, signalState } from '@ngrx/signals'
import { groupBy, isEqual } from 'lodash'
import { TranslateService } from '~/i18n'
import type { SectionGroup } from './types'
import type { VirtualGridCellContext } from './virtual-grid-cell.directive'
import type { QuickFilterGetterFn } from './virtual-grid-options'
import type { VirtualGridRowContext } from './virtual-grid-row.directive'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { map } from 'rxjs'

export interface VirtualGridState<T> {
  data: T[]
  selection: Array<string | number>
  identifyBy: (it: T) => string | number
  /**
   * The quickfilter text
   */
  quickfilter: string
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
  quickfilterGetter: QuickFilterGetterFn<T>
  /**
   *
   */
  getItemSection: (item: T) => string
  withSectionRows: boolean
}

@Injectable()
export class VirtualGridStore<T> {
  private tl8 = inject(TranslateService)
  private state = signalState<VirtualGridState<T>>({
    data: [],
    size: null,
    itemHeight: 100,
    itemWidth: 100,
    colCount: [1, null],
    ngClass: null,
    getItemSection: null,
    identifyBy: null,
    quickfilter: null,
    quickfilterGetter: null,
    selection: null,
    withSectionRows: null,
  })

  public readonly identifyBy = this.state.identifyBy
  public readonly quickfilter = this.state.quickfilter
  public readonly quickfilter$ = toObservable(this.quickfilter)
  public readonly itemSize = this.state.itemHeight
  public readonly ngClass = this.state.ngClass
  public readonly quickfilterGetter = this.state.quickfilterGetter
  public readonly sectionGetter = this.state.getItemSection
  public readonly data = this.state.data
  public readonly dataSections = computed(() => {
    return selectSections(this.data(), this.sectionGetter())
  })

  public readonly selection = computed<Array<string | number>>(() => this.state.selection() || [], { equal: isEqual })
  public readonly selection$ = toObservable(this.selection)
  public readonly dataFiltered = computed(() => {
    return selectSectionsFiltered(this.dataSections(), this.quickfilter(), this.quickfilterGetter(), this.tl8)
  })

  public readonly layout = computed(() => {
    return selectLayout({
      size: this.state.size(),
      itemWidth: this.state.itemWidth(),
      colCount: this.state.colCount(),
    })
  })
  public readonly colCount = computed(() => this.layout().cols)
  public readonly gridSize = computed(() => this.layout().size)
  public readonly rows = computed(() => selectRows(this.dataFiltered(), this.colCount()))
  public readonly rowCount = computed(() => this.rows().length)

  public withSize = rxMethod<number>((size) => {
    return size.pipe(
      map((value) => {
        this.patchState({ size: value })
      }),
    )
  })

  public patchState(value: Partial<VirtualGridState<T>>) {
    patchState(this.state, value)
  }
}

export function selectLayout({
  size,
  itemWidth,
  colCount,
}: Pick<VirtualGridState<any>, 'size' | 'itemWidth' | 'colCount'>) {
  if (!size || size < 0) {
    return {
      size: size,
      cols: 1,
    }
  }

  let [minColumns, maxColumns] = decodeMinmax(colCount)
  if (!minColumns) {
    minColumns = 1
  }
  if (maxColumns && maxColumns < minColumns) {
    maxColumns = minColumns
  }

  let [minWidth, maxWidth] = decodeMinmax(itemWidth)
  if (!minWidth) {
    minWidth = Math.ceil(size / minColumns)
  }
  if (maxWidth && maxWidth < minWidth) {
    maxWidth = minWidth
  }

  // console.log({
  //   size,
  //   minWidth,
  //   maxWidth,
  //   minColumns,
  //   maxColumns,
  // })

  let cols = 1
  if (maxWidth) {
    const m1 = size % minWidth
    const m2 = size % maxWidth
    if (m1 <= m2) {
      cols = Math.floor(size / minWidth)
      size = cols * minWidth
    } else {
      cols = Math.floor(size / maxWidth)
      size = cols * maxWidth
    }
  } else {
    cols = Math.floor(size / minWidth)
    cols = Math.min(Math.max(cols, minColumns), maxColumns || cols)
  }

  if (maxColumns && cols > maxColumns) {
    size -= (size / cols) * (cols - maxColumns)
    cols = maxColumns
  }

  if (!cols) {
    return {
      size: null,
      cols: 1,
    }
  }

  return {
    size: size,
    cols: cols,
  }
}

function decodeMinmax(value: number | [number, number]) {
  if (typeof value === 'number') {
    return [value, null]
  }
  return value || [null, null]
}

function selectRows<T>(sections: Array<SectionGroup<T>>, columns: number) {
  const rows = selectRawRows(sections, columns)

  return rows.map((row, i): VirtualGridRowContext<T> => {
    const context: VirtualGridRowContext<T> = {
      count: rows.length,
      index: i,
      even: i % 2 === 0,
      odd: i % 2 !== 0,
      first: i === 0,
      last: i === rows.length - 1,
      $implicit: null,
    }

    if ('section' in row) {
      context.$implicit = {
        type: 'section',
        section: {
          $implicit: row.section,
        },
      }
      return context
    }

    if ('items' in row) {
      context.$implicit = {
        type: 'items',
        items: row.items.map((cell, j): VirtualGridCellContext<T> => {
          return {
            $implicit: cell,
            count: row.items.length,
            index: j,
            even: j % 2 === 0,
            odd: j % 2 !== 0,
            first: j === 0,
            last: j === row.items.length - 1,
          }
        }),
      }
      return context
    }
    return context
  })
}

function selectRawRows<T>(sections: Array<SectionGroup<T>>, columns: number) {
  const rows: Array<{ section: string } | { items: T[] }> = []
  for (const section of sections) {
    if (section.section) {
      rows.push({
        section: section.section,
      })
    }

    let row: T[]
    let i = 0

    for (const item of section.items) {
      if (!row || row.length === columns) {
        i = 0
        row = []
        rows.push({
          items: row,
        })
      }
      i++
      row.push(item)
    }
  }
  return rows
}

function selectSections<T>(data: NgIterable<T>, sectionFn?: (it: T) => string): SectionGroup<T>[] {
  data ||= []
  const items = Array.isArray(data) ? data : Array.from(data)
  sectionFn = sectionFn || (() => null)
  const groups = groupBy(items, (it) => sectionFn(it))

  return Object.keys(groups).map((key) => ({
    section: key === 'null' ? null : key, // TODO: make clean
    items: groups[key],
  }))
}

function selectSectionsFiltered<T>(
  sections: Array<SectionGroup<T>>,
  query: string,
  getter: QuickFilterGetterFn<T>,
  tl8: TranslateService,
) {
  if (!query || !getter) {
    return sections
  }
  query = query.toLowerCase()
  const results: Array<SectionGroup<T>> = []
  for (const section of sections) {
    const items: T[] = []
    for (const item of section.items) {
      if (
        getter(item, (text) => tl8.get(text))
          .toLowerCase()
          .includes(query)
      ) {
        items.push(item)
      }
    }
    if (items.length) {
      results.push({
        section: section.section,
        items,
      })
    }
  }
  return results
}
