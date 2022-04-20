import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  NgZone,
  ViewChild,
} from '@angular/core'
import { ItemDefinitionMaster, Perks } from '@nw-data/types'
import { isEqual } from 'lodash'
import {
  BehaviorSubject,
  combineLatest,
  defer,
  filter,
  map,
  Subject,
  takeUntil,
} from 'rxjs'
import { BoolValueRenderer, CategoryFilter } from '~/ui/ag-grid'
import { AgGridComponent } from '~/ui/ag-grid/ag-grid.component'
import { LocaleService } from '~/core/i18n'
import { NwService } from '~/core/nw'
import { NwItemMetaService } from '~/core/nw/nw-item-meta.service'

function fieldName(key: keyof ItemDefinitionMaster) {
  return key
}

function field(item: any, key: keyof ItemDefinitionMaster) {
  return item[key]
}

@Component({
  selector: 'nwb-items-table',
  templateUrl: './items-table.component.html',
  styleUrls: ['./items-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemsTableComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild(AgGridComponent, { static: true })
  public grid: AgGridComponent

  @Input()
  public quickFilter: string

  public get gridData() {
    return this.displayItems
  }

  public gridOptions = this.nw.gridOptions({
    rowSelection: 'single',
    onSelectionChanged: (it) => {
      const ids = it.api.getSelectedRows().map((it) => field(it, 'ItemID'))
      this.zone.run(() => this.selectionChange.next(ids))
    },
    onRowDataChanged: () => {
      if (this.selection) {
        this.select(this.selection, {
          ensureVisible: true,
        })
      }
    },
    columnDefs: [
      {
        sortable: false,
        filter: false,
        width: 74,
        cellRenderer: ({ data }) => {
          const rarity = this.nw.itemRarity(data)
          const iconPath = this.nw.iconPath(field(data, 'IconPath'))
          const icon = this.nw.renderIcon(iconPath, {
            size: 38,
            rarity: rarity,
          })
          return `<a href="${this.nw.nwdbLinkUrl('item', field(data, 'ItemID'))}" target="_blank">${icon}</a>`
        },
      },
      {
        width: 250,
        headerName: 'Name',
        valueGetter: ({ data }) => this.nw.translate(field(data, 'Name')),
        getQuickFilterText: ({ value }) => value
      },
      {
        field: fieldName('ItemID'),
        hide: true,
      },
      {
        width: 175,
        filter: false,
        headerName: 'Perks',
        cellRenderer: (params: { data: ItemDefinitionMaster }) => {
          const item = params.data
          const perks = [item.Perk1, item.Perk2, item.Perk3, item.Perk4, item.Perk5]
            .filter((it) => !!it)
            .map((it) => this.perks.get(it))
            .filter((it) => !!it)
            .map((it) => {
              const iconPath = this.nw.iconPath(it.IconPath)
              const icon = this.nw.renderIcon(iconPath, { size: 24 })
              return `<a href="${this.nw.nwdbLinkUrl('perk', it.PerkID)}" target="_blank">${icon}</a>`
            })
            .join(' ')
          const generated = [item.PerkBucket1, item.PerkBucket2, item.PerkBucket3, item.PerkBucket4, item.PerkBucket5]
            .filter((it) => !!it)
            .map(() => {
              return this.nw.renderIcon('/nw-data/crafting/crafting_perkbackground.webp', { size: 24 })
            })
            .join(' ')
          return perks + generated
        },
      },
      {
        headerName: 'Rarity',
        valueGetter: ({ data }) => this.nw.itemRarityName(data),
        filter: CategoryFilter,
        width: 130,
      },
      {
        width: 80,
        field: fieldName('Tier'),
        valueGetter: ({ data }) => this.nw.itemTierRoman(data),
        filter: CategoryFilter,
      },
      {
        headerName: 'User Data',
        children: [
          {
            headerName: 'Fav',
            cellRenderer: BoolValueRenderer,
            cellRendererParams: BoolValueRenderer.params({
              svgTrue: `
                <svg class="block w-6 h-6 fill-primary" viewBox="0 0 576 512"><path d="M381.2 150.3L524.9 171.5C536.8 173.2 546.8 181.6 550.6 193.1C554.4 204.7 551.3 217.3 542.7 225.9L438.5 328.1L463.1 474.7C465.1 486.7 460.2 498.9 450.2 506C440.3 513.1 427.2 514 416.5 508.3L288.1 439.8L159.8 508.3C149 514 135.9 513.1 126 506C116.1 498.9 111.1 486.7 113.2 474.7L137.8 328.1L33.58 225.9C24.97 217.3 21.91 204.7 25.69 193.1C29.46 181.6 39.43 173.2 51.42 171.5L195 150.3L259.4 17.97C264.7 6.954 275.9-.0391 288.1-.0391C300.4-.0391 311.6 6.954 316.9 17.97L381.2 150.3z"/></svg>
              `,
              svgFalse: `
                <svg class="block w-6 h-6 fill-primary opacity-50" viewBox="0 0 576 512"><path d="M287.9 0C297.1 0 305.5 5.25 309.5 13.52L378.1 154.8L531.4 177.5C540.4 178.8 547.8 185.1 550.7 193.7C553.5 202.4 551.2 211.9 544.8 218.2L433.6 328.4L459.9 483.9C461.4 492.9 457.7 502.1 450.2 507.4C442.8 512.7 432.1 513.4 424.9 509.1L287.9 435.9L150.1 509.1C142.9 513.4 133.1 512.7 125.6 507.4C118.2 502.1 114.5 492.9 115.1 483.9L142.2 328.4L31.11 218.2C24.65 211.9 22.36 202.4 25.2 193.7C28.03 185.1 35.5 178.8 44.49 177.5L197.7 154.8L266.3 13.52C270.4 5.249 278.7 0 287.9 0L287.9 0zM287.9 78.95L235.4 187.2C231.9 194.3 225.1 199.3 217.3 200.5L98.98 217.9L184.9 303C190.4 308.5 192.9 316.4 191.6 324.1L171.4 443.7L276.6 387.5C283.7 383.7 292.2 383.7 299.2 387.5L404.4 443.7L384.2 324.1C382.9 316.4 385.5 308.5 391 303L476.9 217.9L358.6 200.5C350.7 199.3 343.9 194.3 340.5 187.2L287.9 78.95z"/></svg>
              `,
              click: ({ data, node, api }) => {
                this.meta.toggleFavourite(field(data, 'ItemID'))
                api.refreshCells({
                  rowNodes: [node]
                })
              }
            }),
            width: 80,
            valueGetter: ({ data }) => !!this.meta.get(field(data, 'ItemID'))?.fav
          },
          {
            headerName: 'Stock',
            headerTooltip: 'Number of items currently owned',
            valueGetter: ({ data }) => {
              return this.meta.get(field(data, 'ItemID'))?.stock
            },
            valueSetter: ({ data, newValue }) => {
              this.meta.merge(field(data, 'ItemID'), {
                stock: Number(newValue) || null
              })
              return true
            },
            editable: true,
            width: 100,
          },
          {
            headerName: 'GS',
            headerTooltip: 'Item owned with this gear score',
            valueGetter: ({ data }) => {
              return this.meta.get(field(data, 'ItemID'))?.gs
            },
            valueSetter: ({ data, newValue }) => {
              this.meta.merge(field(data, 'ItemID'), {
                gs: Number(newValue) || null
              })
              return true
            },
            editable: true,
            width: 100,
          },
          {
            headerName: 'Price',
            headerTooltip: 'Current price in Trading post',
            valueGetter: ({ data }) => {
              return this.meta.get(field(data, 'ItemID'))?.price
            },
            valueSetter: ({ data, newValue }) => {
              this.meta.merge(field(data, 'ItemID'), {
                price: Number(newValue) || null
              })
              return true
            },
            editable: true,
            width: 100,
          },
        ]
      },

      // {
      //   headerName: 'Source',
      //   field: '$source',
      //   filter: CategoryFilter,
      //   width: 125,
      // },

      {
        headerName: 'GS',
        children: [
          {
            headerName: 'Min',
            field: fieldName('MinGearScore'),
            width: 100,
          },
          {
            headerName: 'Max',
            field: fieldName('MaxGearScore'),
            width: 100,
          },
        ]
      },
      {
        field: fieldName('ItemType'),
        width: 125,
        filter: CategoryFilter,
      },
      {
        field: fieldName('ItemClass'),
        // width: 125,
      },
      {
        field: fieldName('TradingGroup'),
        // width: 125,
        filter: CategoryFilter,
      },
      {
        field: fieldName('TradingFamily'),
        width: 125,
        filter: CategoryFilter,
      },
      {
        field: fieldName('TradingCategory'),
        width: 125,
        filter: CategoryFilter,
      },
    ],
  })

  @Input()
  public selection: string[]

  @Output()
  public selectionChange = new EventEmitter<string[]>()

  @Input()
  public filter: (item: ItemDefinitionMaster) => boolean

  public category = defer(() => this.category$)
  public categories = defer(() => this.categorie$)

  private perks: Map<string, Perks>
  private items: ItemDefinitionMaster[]
  private displayItems: ItemDefinitionMaster[]
  private destroy$ = new Subject()
  private category$ = new BehaviorSubject<string>(null)
  private categorie$ = new BehaviorSubject<string[]>(null)

  public constructor(
    private locale: LocaleService,
    private nw: NwService,
    private cdRef: ChangeDetectorRef,
    private zone: NgZone,
    private meta: NwItemMetaService
  ) {
    //
  }

  public async ngOnInit() {
    const item$ = this.nw.db.items.pipe(map((items) => (this.filter ? items.filter(this.filter) : items)))
    const perk$ = this.nw.db.perksMap

    item$
      .pipe(map((items) => Array.from(new Set(items.map((it) => it.ItemType).filter((it) => !!it)))))
      .pipe(takeUntil(this.destroy$))
      .subscribe((cats) => this.categorie$.next(cats))

    combineLatest({
      items: item$,
      perks: perk$,
      category: this.category$,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ items, perks, category }) => {
        this.perks = perks
        this.items = items
        this.displayItems = category ? items.filter((it) => it.ItemType === category) : items
        this.cdRef.markForCheck()
      })

    this.locale.change
      .pipe(filter(() => !!this.grid?.api))
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.grid.api.refreshCells({ force: true })
      })
  }

  public ngOnChanges(changes: SimpleChanges) {
    const selection = this.getChange(changes, 'selection')
    if (selection) {
      this.select(selection.currentValue)
    }
    if (this.getChange(changes, 'quickFilter')) {
      this.cdRef.markForCheck()
    }
  }

  public ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  public setCategory(category: string) {
    this.category$.next(category)
  }

  private getChange(ch: SimpleChanges, key: keyof ItemsTableComponent) {
    return ch[key]
  }

  private select(toSelect: string[], options?: { ensureVisible: boolean }) {
    const api = this.grid?.api
    if (!api) {
      return
    }
    if (
      isEqual(
        toSelect,
        api.getSelectedRows().map((it) => field(it, 'ItemID'))
      )
    ) {
      return
    }
    api.forEachNode((it) => {
      if (toSelect && toSelect.includes(field(it.data, 'ItemID'))) {
        it.setSelected(true, false, true)
      } else if (it.isSelected()) {
        it.setSelected(false, false, true)
      }
    })
    if (options?.ensureVisible) {
      const selectedNode = api.getSelectedNodes()?.[0]
      if (selectedNode) {
        api.ensureNodeVisible(selectedNode, 'middle')
      }
    }
  }
}
