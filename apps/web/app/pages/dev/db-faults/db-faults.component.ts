import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { ItemDefinitionMaster, Perks } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { combineLatest, defer, map, Observable, of } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService, NwInfoLinkService, NwModule } from '~/nw'
import { getItemIconPath, getItemPerks, getItemRarity, isPerkGem, isPerkGenerated, isPerkInherent } from '~/nw/utils'
import { SelectboxFilter } from '~/ui/ag-grid'
import { CellRendererService, DataTableAdapter, DataTableCategory, DataTableModule } from '~/ui/data-table'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
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

@Component({
  standalone: true,
  selector: 'nwb-db-faults-page',
  templateUrl: './db-faults.component.html',
  styleUrls: ['./db-faults.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, QuicksearchModule, DataTableModule],
  providers: [QuicksearchService],
  host: {
    class: 'layout-col bg-base-100',
  },
})
export class DbFaultsComponent extends DataTableAdapter<FaultRow> {
  public entityID(item: FaultRow): string | number {
    return item.item.ItemID
  }

  public entityCategory(item: FaultRow): string | DataTableCategory | (string | DataTableCategory)[] {
    return null
  }

  public options: Observable<GridOptions<FaultRow>> = defer(() =>
    of<GridOptions<FaultRow>>({
      rowSelection: 'single',
      rowBuffer: 0,
      columnDefs: [
        this.colDef({
          colId: 'icon',
          headerValueGetter: () => 'Icon',
          resizable: false,
          sortable: false,
          filter: false,
          pinned: true,
          width: 62,
          cellRenderer: this.cellRenderer(({ data }) => {
            return this.r.link(
              {
                href: this.info.link('item', data.item.ItemID),
                target: '_blank',
              },
              [
                this.r.icon({
                  src: getItemIconPath(data.item),
                  class: ['transition-all', 'translate-x-0', 'hover:translate-x-1'],
                  rarity: getItemRarity(data.item),
                }),
              ]
            )
          }),
        }),
        this.colDef({
          colId: 'name',
          headerValueGetter: () => 'Name',
          sortable: true,
          filter: true,
          width: 250,
          valueGetter: this.valueGetter(({ data }) => this.i18n.get(data.item.Name)),
          cellRenderer: this.r.lineBreaksRenderer(),
          cellClass: ['multiline-cell', 'py-2'],
          autoHeight: true,
          getQuickFilterText: ({ value }) => value,
        }),
        this.colDef({
          colId: 'source',
          headerValueGetter: () => 'Source',
          sortable: true,
          width: 250,
          valueGetter: this.valueGetter(({ data }) => data.item['$source']),
          getQuickFilterText: ({ value }) => value,
          filter: SelectboxFilter,
          filterParams: SelectboxFilter.params({
            showSearch: false,
          }),
        }),
        this.colDef({
          colId: 'faultType',
          headerValueGetter: () => 'Fault Type',
          sortable: true,
          width: 250,
          valueGetter: this.valueGetter(({ data }) => {
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
          filter: SelectboxFilter,
          filterParams: SelectboxFilter.params({
            showSearch: false,
          }),
        }),
        this.colDef({
          colId: 'itemClass',
          headerValueGetter: () => 'Item Class',
          width: 250,
          valueGetter: this.valueGetter(({ data }) => data.item.ItemClass),
          cellRenderer: this.r.tagListRenderer(humanize),
          filter: SelectboxFilter,
          filterParams: SelectboxFilter.params({
            showCondition: true,
            conditionAND: false,
            showSearch: true,
          }),
        }),
        ...[0, 1, 2, 3, 4].map((i) =>
          this.colDef({
            colId: `perk-${i}`,
            filter: false,
            headerValueGetter: () => `Perk ${i + 1}`,
            width: 250,
            valueGetter: this.valueGetter(({ data }) => data.perks[i]?.perk?.ItemClass || []),
            cellClass: ({ data }) => {
              if (!data.perks[i]?.perk) {
                return ''
              }
              if (!data.perks[i]?.ok) {
                return 'error-cell'
              }
              return ''
            },
            cellRenderer: this.r.tagListRenderer(humanize),
          })
        ),
      ],
    })
  )
  public entities: Observable<FaultRow[]> = defer(() => this.getItemPerkFaults())

  protected adapter = this

  public constructor(
    private nwDb: NwDbService,
    private i18n: TranslateService,
    protected search: QuicksearchService,
    private r: CellRendererService,
    private info: NwInfoLinkService
  ) {
    super()
  }

  private getItemPerkFaults() {
    return combineLatest({
      items: this.nwDb.items,
      perks: this.nwDb.perksMap,
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
            const a = (item.ItemClass || []).map((it) => it.toLowerCase())
            const b = (perk.ItemClass || []).map((it) => it.toLowerCase())
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
