import { Injectable, NgIterable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { TranslateService } from '~/i18n'
import { VirtualGridCellContext } from './virtual-grid-cell.directive'
import { QuickFilterGetterFn } from './virtual-grid-options'
import { VirtualGridRowContext } from './virtual-grid-row.directive'
import { groupBy, isEqual } from 'lodash'
import { SectionGroup, VirtualGridSection } from './types'
import { CaseInsensitiveMap } from '~/utils'

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
  /**
   *
   */
  getItemSection?: (item: T) => string
  withSectionRows?: boolean
}

@Injectable()
export class VirtualGridStore<T> extends ComponentStore<VirtualGridState<T>> {
  public readonly identifyBy$ = this.selectSignal(({ identifyBy }) => identifyBy)
  public readonly quickfilter$ = this.select(({ quickfilter }) => quickfilter)
  public readonly itemSize$ = this.select(({ itemHeight }) => itemHeight)
  public readonly ngClass$ = this.select(({ ngClass }) => ngClass)
  public readonly quickfilterGetter$ = this.select(({ quickfilterGetter }) => quickfilterGetter)
  public readonly sectionGetter$ = this.select(({ getItemSection }) => getItemSection)
  public readonly data$ = this.select(({ data }) => data || [])
  public readonly dataSections$ = this.select(this.data$, this.sectionGetter$, selectSections)

  public readonly selection$ = this.select<Array<string | number>>(
    ({ selection }) => {
      return selection || []
    },
    {
      equal: isEqual,
    }
  )
  public readonly selection = this.selectSignal(({ selection }) => selection || [])
  public readonly dataFiltered$ = this.select(
    this.dataSections$,
    this.quickfilter$,
    this.quickfilterGetter$,
    (list, query, getter) => selectSectionsFiltered(list, query, getter, this.tl8)
  )

  public readonly colCount$ = this.select(this.state$, selectColumnCount)
  public readonly rows$ = this.select(this.dataFiltered$, this.colCount$, selectRows, {
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
  return Math.min(Math.max(cols, minColumns), maxColumns || cols)
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
  console.log('selectRawRows', sections)
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
    while (i > 0 && i < columns) {
      i++
      row.push(null)
    }
  }
  return rows
}

function selectSections<T>(data: NgIterable<T>, sectionFn?: (it: T) => string): SectionGroup<T>[] {
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
  tl8: TranslateService
) {
  if (!query || !getter) {
    return sections
  }
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
