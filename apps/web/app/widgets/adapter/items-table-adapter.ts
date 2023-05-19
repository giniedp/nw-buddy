import { Inject, Injectable, Optional } from '@angular/core'
import { COLS_ITEMDEFINITIONMASTER } from '@nw-data/cols'
import { ItemDefinitionMaster, Perks } from '@nw-data/types'
import { ColDef, GridOptions } from 'ag-grid-community'
import { Observable, combineLatest, defer, map, of } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService, NwLinkService } from '~/nw'
import {
  getItemIconPath,
  getItemId,
  getItemMaxGearScore,
  getItemMinGearScore,
  getItemPerkBucketIds,
  getItemPerks,
  getItemRarity,
  getItemRarityLabel,
  getItemTierAsRoman,
  getItemTradingFamilyLabel,
  getItemTradingGroupLabel,
  getItemTypeLabel,
  getTradingCategoryLabel,
  isItemNamed,
} from '~/nw/utils'
import { NW_FALLBACK_ICON } from '~/nw/utils/constants'
import { ItemPreferencesService } from '~/preferences'
import { RangeFilter, SelectFilter } from '~/ui/ag-grid'
import { DataTableAdapter, DataTableAdapterOptions, DataTableCategory, dataTableProvider } from '~/ui/data-table'
import { assetUrl, humanize, shareReplayRefCount } from '~/utils'
import { ItemTrackerFilter } from '~/widgets/item-tracker'
import { BookmarkCell, TrackingCell } from './components'

export type ItemsTableItem = ItemDefinitionMaster & {
  $perks: Perks[]
  $perkBuckets: string[]
}

@Injectable()
export class ItemsTableAdapterConfig extends DataTableAdapterOptions<ItemDefinitionMaster> {
  hideUserData?: boolean
}

@Injectable()
export class ItemsTableAdapter extends DataTableAdapter<ItemsTableItem> {
  public static provider(config?: ItemsTableAdapterConfig) {
    return dataTableProvider({
      adapter: ItemsTableAdapter,
      options: config,
    })
  }

  public entityID(item: ItemsTableItem): string {
    return item.ItemID
  }

  public entityCategory(item: ItemsTableItem): DataTableCategory {
    if (!item.ItemType) {
      return null
    }
    return {
      value: item.ItemType,
      label: this.i18n.get(getItemTypeLabel(item.ItemType)),
      icon: '',
    }
  }

  public override get persistStateId(): string {
    return this.config?.persistStateId
  }

  public options = defer(() =>
    of<GridOptions>({
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
            return this.createLinkWithIcon({
              href: this.info.link('item', data.ItemID),
              target: '_blank',
              icon: getItemIconPath(data) || NW_FALLBACK_ICON,
              rarity: getItemRarity(data),
              named: isItemNamed(data),
              iconClass: ['transition-all', 'translate-x-0', 'hover:translate-x-1'],
            })
          }),
        }),
        this.colDef({
          colId: 'name',
          headerValueGetter: () => 'Name',
          sortable: true,
          filter: true,
          width: 250,
          valueGetter: this.valueGetter(({ data }) => this.i18n.get(data.Name)),
          cellRenderer: this.cellRenderer(({ value }) => this.makeLineBreaks(value)),
          cellClass: ['multiline-cell', 'py-2'],
          autoHeight: true,
          getQuickFilterText: ({ value }) => value,
        }),
        this.colDef({
          colId: 'itemId',
          headerValueGetter: () => 'Item ID',
          field: this.fieldName('ItemID'),
          hide: true,
        }),
        this.colDef({
          colId: 'perks',
          width: 175,
          sortable: false,
          headerValueGetter: () => 'Perks',
          valueGetter: this.valueGetter(({ data }) => data.$perks?.map((it) => it?.PerkID)),
          cellRenderer: this.cellRenderer(({ data }) => {
            const perks = data.$perks || []
            const buckets = data.$perkBuckets || []
            if (!!perks && !buckets) {
              return null
            }
            return this.createElement({
              tag: 'div',
              classList: ['flex', 'flex-row', 'items-center', 'h-full'],
              children: [
                ...perks.map((perk) =>
                  this.createElement({
                    tag: 'a',
                    classList: ['block', 'w-7', 'h-7'],
                    tap: (a) => {
                      a.target = '_blank'
                      a.href = this.info.link('perk', perk?.PerkID)
                    },
                    children: [
                      this.createIcon((pic, img) => {
                        img.classList.add('w-7', 'h-7', 'nw-icon')
                        img.src = perk?.IconPath
                      }),
                    ],
                  })
                ),
                ...buckets.map(() => {
                  return this.createIcon((pic, img) => {
                    img.classList.add('w-7', 'h-7', 'nw-icon')
                    img.src = assetUrl('assets/icons/crafting_perkbackground.png')
                  })
                }),
              ],
            })
          }),
          filter: SelectFilter,
          filterParams: SelectFilter.params({
            showSearch: true,
            optionsGetter: (node) => {
              const perks = (node.data as ItemsTableItem).$perks || []
              return perks.map((perk) => {
                return {
                  id: perk.PerkID,
                  label: this.i18n.get(perk.DisplayName || perk.AppliedSuffix || perk.AppliedPrefix),
                  icon: perk.IconPath,
                }
              })
            },
          }),
        }),
        this.colDef({
          colId: 'rarity',
          headerValueGetter: () => 'Rarity',
          valueGetter: this.valueGetter(({ data }) => getItemRarity(data)),
          valueFormatter: ({ value }) => this.i18n.get(getItemRarityLabel(value)),
          getQuickFilterText: ({ value }) => this.i18n.get(getItemRarityLabel(value)),
          filter: SelectFilter,
          width: 130,
        }),
        this.colDef({
          colId: 'tier',
          headerValueGetter: () => 'Tier',
          width: 80,
          valueGetter: this.valueGetter(({ data }) => data.Tier || null),
          valueFormatter: ({ value }) => getItemTierAsRoman(value),
          filter: SelectFilter,
        }),

        this.colDef({
          colId: 'userBookmark',
          headerValueGetter: () => 'Bookmark',
          hide: this.config?.hideUserData,
          width: 100,
          cellClass: 'cursor-pointer',
          filter: ItemTrackerFilter,
          valueGetter: this.valueGetter(({ data }) => this.itemPref.get(data.ItemID)?.mark || 0),
          cellRenderer: BookmarkCell,
          cellRendererParams: BookmarkCell.params({
            getId: (value: ItemsTableItem) => getItemId(value),
            pref: this.itemPref,
          }),
        }),
        ...(this.config?.hideUserData
          ? []
          : [
              this.colDef({
                colId: 'userStockCount',
                headerValueGetter: () => 'In Stock',
                suppressMenu: false,
                headerTooltip: 'Number of items currently owned',
                valueGetter: this.valueGetter(({ data }) => this.itemPref.get(data.ItemID)?.stock),
                cellRenderer: TrackingCell,
                cellRendererParams: TrackingCell.params({
                  getId: (value: ItemsTableItem) => getItemId(value),
                  pref: this.itemPref,
                  mode: 'stock',
                  class: 'text-right',
                }),
                width: 90,
              }),
              this.colDef({
                colId: 'userOwnedWithGS',
                headerValueGetter: () => 'Owned GS',
                headerTooltip: 'Item owned with this gear score',
                valueGetter: this.valueGetter(({ data }) => this.itemPref.get(data.ItemID)?.gs),
                cellRenderer: TrackingCell,
                cellRendererParams: TrackingCell.params({
                  getId: (value: ItemsTableItem) => getItemId(value),
                  pref: this.itemPref,
                  mode: 'gs',
                }),
                width: 100,
              }),
              this.colDef({
                colId: 'userPrice',
                headerValueGetter: () => 'Price',
                headerTooltip: 'Current price in Trading post',
                cellClass: 'text-right',
                valueGetter: this.valueGetter(({ data }) => this.itemPref.get(data.ItemID)?.price),
                cellRenderer: TrackingCell,
                cellRendererParams: TrackingCell.params({
                  getId: (value: ItemsTableItem) => getItemId(value),
                  pref: this.itemPref,
                  mode: 'price',
                  formatter: this.moneyFormatter,
                }),
                width: 100,
              }),
            ]),
        this.colDef({
          colId: 'gearScore',
          headerValueGetter: () => 'Gear Score',
          width: 120,
          cellClass: 'text-right',
          comparator: (a, b) => {
            if (a[1] !== b[1]) {
              return (a[1] || 0) - (b[1] || 0)
            }
            return (a[0] || 0) - (b[0] || 0)
          },
          valueGetter: this.valueGetter(({ data }) => {
            let min = getItemMinGearScore(data, false)
            let max = getItemMaxGearScore(data, false)
            return [min, max]
          }),
          valueFormatter: ({ value }) => {
            if (value[0] === value[1]) {
              return String(value[0] ?? '')
            }
            return `${value[0]}-${value[1]}`
          },
          filter: RangeFilter,
        }),
        this.colDef({
          colId: 'source',
          headerValueGetter: () => 'Source',
          field: '$source',
          valueFormatter: ({ value }) => humanize(value),
          width: 125,
          filter: SelectFilter,
        }),
        this.colDef({
          colId: 'attributionId',
          headerValueGetter: () => 'Event',
          width: 180,
          field: this.fieldName('AttributionId'),
          valueFormatter: ({ value }) => humanize(value),
          filter: SelectFilter,
        }),
        this.colDef({
          colId: 'itemType',
          headerValueGetter: () => 'Item Type',
          valueGetter: this.valueGetter(({ data }) => data.ItemType),
          valueFormatter: ({ value }) => this.i18n.get(getItemTypeLabel(value)),
          getQuickFilterText: ({ value }) => this.i18n.get(getItemTypeLabel(value)),
          width: 125,
          filter: SelectFilter,
        }),
        this.colDef({
          colId: 'itemClass',
          headerValueGetter: () => 'Item Class',
          width: 250,
          field: this.fieldName('ItemClass'),
          cellRenderer: this.cellRendererTags(humanize),
          filter: SelectFilter,
          filterParams: SelectFilter.params({
            showSearch: true,
          }),
        }),
        this.colDef({
          colId: 'tradingGroup',
          headerValueGetter: () => 'Trading Group',
          valueGetter: this.valueGetter(({ data }) => data.TradingGroup),
          valueFormatter: this.valueFormatter<string>(({ value }) => this.i18n.get(getItemTradingGroupLabel(value))),
          filter: SelectFilter,
          filterParams: SelectFilter.params({
            showSearch: true,
          }),
        }),
        this.colDef({
          colId: 'tradingFamily',
          headerValueGetter: () => 'Trading Family',
          width: 125,
          valueGetter: this.valueGetter(({ data }) => data.TradingFamily),
          valueFormatter: this.valueFormatter<string>(({ value }) => this.i18n.get(getItemTradingFamilyLabel(value))),
          filter: SelectFilter,
          filterParams: SelectFilter.params({
            showSearch: true,
          }),
        }),
        this.colDef({
          colId: 'tradingCategory',
          headerValueGetter: () => 'Trading Category',
          width: 125,
          valueGetter: this.valueGetter(({ data }) => data.TradingCategory),
          valueFormatter: this.valueFormatter<string>(({ value }) => this.i18n.get(getTradingCategoryLabel(value))),
          filter: SelectFilter,
        }),
      ],
    })
  ).pipe(map((options) => appendFields(options, Array.from(Object.entries(COLS_ITEMDEFINITIONMASTER)))))

  public entities: Observable<ItemsTableItem[]> = defer(() => {
    return combineLatest({
      items: this.config?.source || this.db.items,
      perks: this.db.perksMap,
    }).pipe(
      map(({ items, perks }) => {
        return items.map((it): ItemsTableItem => {
          return {
            ...it,
            $perks: getItemPerks(it, perks),
            $perkBuckets: getItemPerkBucketIds(it),
          }
        })
      })
    )
  }).pipe(shareReplayRefCount(1))

  public constructor(
    private db: NwDbService,
    private itemPref: ItemPreferencesService,
    private i18n: TranslateService,
    @Inject(DataTableAdapterOptions)
    @Optional()
    private config: ItemsTableAdapterConfig,
    private info: NwLinkService
  ) {
    super()
  }
}

function appendFields(options: GridOptions, fields: string[][]) {
  for (const [field, type] of fields) {
    const exists = options.columnDefs.find((col: ColDef) => col.colId?.toLowerCase() == field.toLowerCase())
    if (exists) {
      continue
    }
    const colDef: ColDef = {
      colId: field,
      headerValueGetter: () => humanize(field),
      field: field,
      hide: true,
    }
    colDef.filter = SelectFilter
    colDef.filterParams = SelectFilter.params({
      showSearch: true,
    })
    if (type.includes('number')) {
      colDef.filter = 'agNumberColumnFilter'
      colDef.filterParams = null
    }
    options.columnDefs.push(colDef)
  }
  return options
}
