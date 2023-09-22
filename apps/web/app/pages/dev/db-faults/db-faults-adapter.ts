import { GridOptions } from '@ag-grid-community/core'
import { inject } from '@angular/core'
import {
  NW_FALLBACK_ICON,
  getItemIconPath,
  getItemPerks,
  isPerkGem,
  isPerkGenerated,
  isPerkInherent,
} from '@nw-data/common'
import { ItemDefinitionMaster, Perks } from '@nw-data/generated'
import { Observable, combineLatest, defer, map } from 'rxjs'
import { NwDbService } from '~/nw'
import { SelectFilter } from '~/ui/data/ag-grid'
import { TableGridUtils } from '~/ui/data/table-grid'
import { DataViewAdapter, DataViewCategory } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { humanize } from '~/utils'

export interface FaultRow {
  item: ItemDefinitionMaster
  gemFault: boolean
  inherentFault: boolean
  generatedFault: boolean
  perks: Array<{
    ok: boolean
    perk: Perks
  }>
}

export class DbFaultsTableAdapter implements DataViewAdapter<FaultRow> {
  private db: NwDbService = inject(NwDbService)
  private utils: TableGridUtils<FaultRow> = inject(TableGridUtils)

  public entityID(item: FaultRow): string | number {
    return item.item.ItemID
  }

  public entityCategories(item: FaultRow): DataViewCategory[] {
    return null
  }

  public virtualOptions(): VirtualGridOptions<FaultRow> {
    return null
  }

  public gridOptions(): GridOptions<FaultRow> {
    const utils = this.utils
    return {
      rowSelection: 'single',
      rowBuffer: 0,
      columnDefs: [
        utils.colDef({
          colId: 'icon',
          headerValueGetter: () => 'Icon',
          resizable: false,
          sortable: false,
          filter: false,
          pinned: true,
          width: 62,
          cellRenderer: utils.cellRenderer(({ data }) => {
            return utils.elA(
              {
                attrs: {
                  href: utils.nwLink.link('item', data.item.ItemID),
                  target: '_blank',
                },
              },
              [
                utils.elImg({
                  src: getItemIconPath(data.item) || NW_FALLBACK_ICON,
                  class: ['transition-all', 'translate-x-0', 'hover:translate-x-1'],
                }),
              ]
            )
          }),
        }),
        utils.colDef({
          colId: 'name',
          headerValueGetter: () => 'Name',
          sortable: true,
          filter: true,
          width: 250,
          valueGetter: utils.valueGetter(({ data }) => utils.i18n.get(data.item.Name)),
          cellRenderer: utils.lineBreaksRenderer(),
          cellClass: ['multiline-cell', 'py-2'],
          autoHeight: true,
          getQuickFilterText: ({ value }) => value,
        }),
        utils.colDef({
          colId: 'source',
          headerValueGetter: () => 'Source',
          sortable: true,
          width: 250,
          valueGetter: utils.valueGetter(({ data }) => data.item['$source']),
          getQuickFilterText: ({ value }) => value,
          filter: SelectFilter,
          filterParams: SelectFilter.params({
            showSearch: false,
          }),
        }),
        utils.colDef({
          colId: 'faultType',
          headerValueGetter: () => 'Fault Type',
          sortable: true,
          width: 250,
          valueGetter: utils.valueGetter(({ data }) => {
            const result = []
            if (data.gemFault) {
              result.push('gem')
            }
            if (data.inherentFault) {
              result.push('attribute')
            }
            if (data.generatedFault) {
              result.push('perk')
            }
            return result
          }),
          getQuickFilterText: ({ value }) => value,
          filter: SelectFilter,
          filterParams: SelectFilter.params({
            showSearch: false,
          }),
        }),
        utils.colDef({
          colId: 'itemClass',
          headerValueGetter: () => 'Item Class',
          width: 250,
          valueGetter: utils.valueGetter(({ data }) => data.item?.ItemClass),
          cellRenderer: utils.tagsRenderer({ transform: humanize }),
          filter: SelectFilter,
          filterParams: SelectFilter.params({
            showSearch: true,
          }),
        }),
        ...[0, 1, 2, 3, 4].map((i) =>
          utils.colDef({
            colId: `perk-${i}`,
            filter: false,
            headerValueGetter: () => `Perk ${i + 1}`,
            width: 250,
            valueGetter: utils.valueGetter(({ data }) => data.perks[i]?.perk?.ItemClass || []),
            cellClass: ({ data }) => {
              if (!data.perks[i]?.perk) {
                return ''
              }
              if (!data.perks[i]?.ok) {
                return 'error-cell'
              }
              return ''
            },
            cellRenderer: utils.tagsRenderer({ transform: humanize }),
          })
        ),
      ],
    }
  }

  public connect(): Observable<FaultRow[]> {
    return this.entities
  }

  public entities: Observable<FaultRow[]> = defer(() => this.getItemPerkFaults())

  protected adapter = this

  private getItemPerkFaults() {
    return combineLatest({
      items: this.db.items,
      perks: this.db.perksMap,
    }).pipe(
      map(({ items, perks }) => {
        const faults: FaultRow[] = []
        for (const item of items) {
          const node: FaultRow = {
            item,
            perks: [],
            gemFault: false,
            inherentFault: false,
            generatedFault: false,
          }
          let isFault = false
          for (const perk of getItemPerks(item, perks) || []) {
            const data = {
              perk: perk,
              ok: true,
            }
            node.perks.push(data)
            const a = (item?.ItemClass || []).map((it) => it.toLowerCase())
            const b = (perk?.ItemClass || []).map((it) => it.toLowerCase())
            if (a.length && b.length && !a.some((it) => b.includes(it))) {
              isFault = true
              data.ok = false
              if (isPerkGem(perk)) {
                node.gemFault = true
              } else if (isPerkInherent(perk)) {
                node.inherentFault = true
              } else if (isPerkGenerated(perk)) {
                node.generatedFault = true
              }
            }
          }
          if (isFault) {
            faults.push(node)
          }
        }
        return faults
      })
    )
  }
}
