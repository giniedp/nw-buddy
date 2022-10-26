import { Injectable, Optional } from '@angular/core'
import { ItemDefinitionMaster, Perks } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { combineLatest, defer, map, Observable, of } from 'rxjs'
import { TranslateService } from '~/i18n'
import { nwdbLinkUrl, NwService } from '~/nw'
import { getItemIconPath, getItemId, getItemPerkBucketIds, getItemPerks, getItemRarity, getItemRarityName, getItemTierAsRoman } from '~/nw/utils'
import { RangeFilter, SelectboxFilter } from '~/ui/ag-grid'
import { DataTableAdapter } from '~/ui/data-table'
import { humanize, shareReplayRefCount } from '~/utils'
import { ItemTrackerFilter } from '~/widgets/item-tracker'
import { BookmarkCell, TrackingCell } from './components'

export type ItemsTableItem = ItemDefinitionMaster & {
  $perks: Perks[]
  $perkBuckets: string[]
}

@Injectable()
export class ItemsTableAdapterConfig {
  hideUserData?: boolean
  source?: Observable<ItemDefinitionMaster[]>
  persistStateId?: string
}

@Injectable()
export class ItemsTableAdapter extends DataTableAdapter<ItemsTableItem> {
  public static provider(config?: ItemsTableAdapterConfig) {
    const provider = []
    if (config) {
      provider.push({
        provide: ItemsTableAdapterConfig,
        useValue: config
      })
    }
    provider.push(DataTableAdapter.provideClass(ItemsTableAdapter))
    return provider
  }

  public entityID(item: ItemsTableItem): string {
    return item.ItemID
  }

  public entityCategory(item: ItemsTableItem): string {
    return item.ItemType
  }
  public override get persistStateId(): string {
    return this.config?.persistStateId
  }

  public options = defer(() =>
    of<GridOptions>({
      rowSelection: 'single',
      rowBuffer: 0,
      // suppressRowHoverHighlight: true,
      columnDefs: [
        this.colDef({
          colId: 'icon',
          headerValueGetter: () => 'Icon',
          resizable: false,
          sortable: false,
          filter: false,
          pinned: true,
          width: 54,
          cellRenderer: this.cellRenderer(({ data }) => {
            return this.createLinkWithIcon({
              href: nwdbLinkUrl('item', data.ItemID),
              target: '_blank',
              icon: getItemIconPath(data),
              rarity: getItemRarity(data),
              iconClass: ['transition-all', 'translate-x-0', 'hover:translate-x-1']
            })
          })
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
          valueGetter: this.valueGetter(({ data }) => data.$perks?.map((it) => it.PerkID)),
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
                ...perks.map((perk) => this.createElement({
                  tag: 'a',
                  classList: ['block', 'w-7', 'h-7'],
                  tap: (a) => {
                    a.target = '_blank'
                    a.href = nwdbLinkUrl('perk', perk.PerkID)
                  },
                  children: [
                    this.createIcon((pic, img) => {
                      img.classList.add('w-7', 'h-7', 'nw-icon')
                      img.src = perk.IconPath
                    })
                  ]
                })),
                ...buckets.map(() => {
                  return this.createIcon((pic, img) => {
                    img.classList.add('w-7', 'h-7', 'nw-icon')
                    img.src = 'assets/icons/crafting_perkbackground.png'
                  })
                })
              ]
            })
          }),
          filter: SelectboxFilter,
          filterParams: SelectboxFilter.params({
            showSearch: true,
            showCondition: true,
            optionsGetter: (node) => {
              const perks = (node.data as ItemsTableItem ).$perks || []
              return perks.map((perk) => {
                return {
                  id: perk.PerkID,
                  label: this.i18n.get(perk.DisplayName || perk.AppliedSuffix || perk.AppliedPrefix),
                  icon: perk.IconPath
                }
              })
            }
          })
        }),
        this.colDef({
          colId: 'rarity',
          headerValueGetter: () => 'Rarity',
          valueGetter: ({ data }) => String(getItemRarity(data)),
          valueFormatter: ({ value }) => this.i18n.get(getItemRarityName(value)),
          filter: SelectboxFilter,
          width: 130,
          getQuickFilterText: ({ value }) => value,
        }),
        this.colDef({
          colId: 'tier',
          headerValueGetter: () => 'Tier',
          width: 80,
          field: this.fieldName('Tier'),
          valueGetter: ({ data }) => getItemTierAsRoman(data.Tier),
          filter: SelectboxFilter,
        }),
        this.colDef({
          colId: 'userBookmark',
          headerValueGetter: () => 'Bookmark',
          hide: this.config?.hideUserData,
          width: 100,
          cellClass: 'cursor-pointer',
          filter: ItemTrackerFilter,
          valueGetter: this.valueGetter(({ data }) => this.nw.itemPref.get(data.ItemID)?.mark || 0),
          cellRenderer: BookmarkCell,
          cellRendererParams: BookmarkCell.params({
            getId: (value: ItemsTableItem) => getItemId(value),
            pref: this.nw.itemPref
          }),
        }),
        this.colDef({
          colId: 'userStockCount',
          headerValueGetter: () => 'In Stock',
          hide: this.config?.hideUserData,
          suppressMenu: false,
          headerTooltip: 'Number of items currently owned',
          valueGetter: this.valueGetter(({ data }) => this.nw.itemPref.get(data.ItemID)?.stock),
          cellRenderer: TrackingCell,
          cellRendererParams: TrackingCell.params({
            getId: (value: ItemsTableItem) => getItemId(value),
            pref: this.nw.itemPref,
            mode: 'stock',
            class: 'text-right',
          }),
          width: 90,
        }),
        this.colDef({
          colId: 'userOwnedWithGS',
          headerValueGetter: () => 'Owned GS',
          hide: this.config?.hideUserData,
          headerTooltip: 'Item owned with this gear score',
          valueGetter: this.valueGetter(({ data }) => this.nw.itemPref.get(data.ItemID)?.gs),
          cellRenderer: TrackingCell,
          cellRendererParams: TrackingCell.params({
            getId: (value: ItemsTableItem) => getItemId(value),
            pref: this.nw.itemPref,
            mode: 'gs',
          }),
          width: 100,
        }),
        this.colDef({

          colId: 'userPrice',
          headerValueGetter: () => 'Price',
          hide: this.config?.hideUserData,
          headerTooltip: 'Current price in Trading post',
          cellClass: 'text-right',
          valueGetter: this.valueGetter(({ data }) => this.nw.itemPref.get(data.ItemID)?.price),
          cellRenderer: TrackingCell,
          cellRendererParams: TrackingCell.params({
            getId: (value: ItemsTableItem) => getItemId(value),
            pref: this.nw.itemPref,
            mode: 'price',
            formatter: this.moneyFormatter,
          }),
          width: 100,
        }),

        this.colDef({
          colId: 'gearScore',
          headerValueGetter: () => 'Gear Score',
          width: 120,
          cellClass: 'text-right',
          comparator: (a, b) => a[1] - b[1],
          valueGetter: this.valueGetter(({ data }) => {
            let min = data.GearScoreOverride || data.MinGearScore
            let max = data.GearScoreOverride || data.MaxGearScore
            return [min, max]
          }),
          valueFormatter: ({ value }) => {
            if (value[0] === value[1]) {
              return String(value[0])
            }
            return `${value[0]}-${value[1]}`
          },
          filter: RangeFilter
        }),
        this.colDef({
          colId: 'source',
          headerValueGetter: () => 'Item Source',
          field: '$source',
          width: 125,
          filter: SelectboxFilter,
        }),
        this.colDef({
          colId: 'itemType',
          headerValueGetter: () => 'Item Type',
          field: this.fieldName('ItemType'),
          width: 125,
          filter: SelectboxFilter,
          getQuickFilterText: ({ value }) => value,
        }),
        this.colDef({
          colId: 'itemClass',
          headerValueGetter: () => 'Item Class',
          width: 250,
          field: this.fieldName('ItemClass'),
          cellRenderer: this.cellRendererTags(humanize),
          filter: SelectboxFilter,
          filterParams: SelectboxFilter.params({
            showCondition: true,
            conditionAND: false,
            showSearch: true
          })
        }),
        this.colDef({
          colId: 'tradingGroup',
          headerValueGetter: () => 'Trading Group',
          field: this.fieldName('TradingGroup'),
          valueFormatter: ({ value }) => humanize(value),
          filter: SelectboxFilter,
          filterParams: SelectboxFilter.params({
            showSearch: true
          })
        }),
        this.colDef({
          colId: 'tradingFamily',
          headerValueGetter: () => 'Trading Family',
          width: 125,
          field: this.fieldName('TradingFamily'),
          valueFormatter: ({ value }) => humanize(value),
          filter: SelectboxFilter,
          filterParams: SelectboxFilter.params({
            showSearch: true
          })
        }),
        this.colDef({
          colId: 'tradingCategory',
          headerValueGetter: () => 'Trading Category',
          width: 125,
          field: this.fieldName('TradingCategory'),
          valueFormatter: ({ value }) => humanize(value),
          filter: SelectboxFilter,
        }),
      ],
    }
  ))

  public entities: Observable<ItemsTableItem[]> = defer(() => {
    return combineLatest({
      items: this.config?.source || this.nw.db.items,
      perks: this.nw.db.perksMap,
    })
      .pipe(map(({ items, perks }) => {
        return items.map((it): ItemsTableItem => {
          return {
            ...it,
            $perks: getItemPerks(it, perks),
            $perkBuckets: getItemPerkBucketIds(it)
          }
        })
      }))
  }).pipe(
    shareReplayRefCount(1)
  )

  public constructor(
    private nw: NwService,
    private i18n: TranslateService,
    @Optional()
    private config: ItemsTableAdapterConfig,
  ) {
    super()
  }
}
