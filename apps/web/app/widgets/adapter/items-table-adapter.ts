import { Injectable, Optional } from '@angular/core'
import { ItemDefinitionMaster, Perks } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import m from 'mithril'
import { combineLatest, defer, map, Observable, of } from 'rxjs'
import { TranslateService } from '~/i18n'
import { nwdbLinkUrl, NwService } from '~/nw'
import { getItemIconPath, getItemId, getItemPerkBucketIds, getItemPerks, getItemRarity, getItemRarityName, getItemTierAsRoman } from '~/nw/utils'
import { AgGridComponent, RangeFilter, SelectboxFilter } from '~/ui/ag-grid'
import { DataTableAdapter } from '~/ui/data-table'
import { humanize, shareReplayRefCount } from '~/utils'
import { ItemMarkerCell, ItemTrackerCell, ItemTrackerFilter } from '~/widgets/item-tracker'
import { BookmarkCell, TrackingCell } from './components'

type ItemDefinitionMasterWithPerks = ItemDefinitionMaster & {
  $perks: Perks[]
  $perkBuckets: string[]
}

@Injectable()
export class ItemsTableAdapterConfig {
  hideUserData?: boolean
  source?: Observable<ItemDefinitionMaster[]>
}

@Injectable()
export class ItemsTableAdapter extends DataTableAdapter<ItemDefinitionMasterWithPerks> {
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

  public entityID(item: ItemDefinitionMasterWithPerks): string {
    return item.ItemID
  }

  public entityCategory(item: ItemDefinitionMasterWithPerks): string {
    return item.ItemType
  }

  public options = defer(() =>
    of<GridOptions>({
      rowSelection: 'single',
      rowBuffer: 0,
      // suppressRowHoverHighlight: true,
      columnDefs: [
        {
          sortable: false,
          filter: false,
          width: 54,
          pinned: true,
          cellRenderer: this.cellRenderer(({ data }) => {
            return this.createLinkWithIcon({
              href: nwdbLinkUrl('item', data.ItemID),
              target: '_blank',
              icon: getItemIconPath(data),
              rarity: getItemRarity(data),
              iconClass: ['transition-all', 'translate-x-0', 'hover:translate-x-1']
            })
          })
        },
        {
          width: 250,
          headerName: 'Name',
          valueGetter: this.valueGetter(({ data }) => this.i18n.get(data.Name)),
          cellRenderer: this.cellRenderer(({ value }) => this.makeLineBreaks(value)),
          cellClass: ['multiline-cell', 'py-2'],
          autoHeight: true,
          getQuickFilterText: ({ value }) => value,
        },
        {
          field: this.fieldName('ItemID'),
          hide: true,
        },
        {
          width: 175,
          sortable: false,
          headerName: 'Perks',
          field: this.fieldName('$perks'),
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
              const perks = (node.data as ItemDefinitionMasterWithPerks ).$perks || []
              return perks.map((perk) => {
                return {
                  label: this.i18n.get(perk.DisplayName || perk.AppliedSuffix || perk.AppliedPrefix),
                  value: perk,
                  icon: perk.IconPath
                }
              })
            }
          })
        },
        {
          headerName: 'Rarity',
          valueGetter: ({ data }) => getItemRarity(data),
          valueFormatter: ({ value }) => this.i18n.get(getItemRarityName(value)),
          filter: SelectboxFilter,
          width: 130,
          getQuickFilterText: ({ value }) => value,
        },
        {
          width: 80,
          field: this.fieldName('Tier'),
          valueGetter: ({ data }) => getItemTierAsRoman(data.Tier),
          filter: SelectboxFilter,
        },
        {
          headerName: 'User Data',
          children: [
            {
              hide: this.config?.hideUserData,
              width: 100,
              headerName: 'Bookmark',
              cellClass: 'cursor-pointer',
              filter: ItemTrackerFilter,
              valueGetter: this.valueGetter(({ data }) => this.nw.itemPref.get(data.ItemID)?.mark || 0),
              cellRenderer: BookmarkCell,
              cellRendererParams: BookmarkCell.params({
                getId: (value: ItemDefinitionMasterWithPerks) => getItemId(value),
                pref: this.nw.itemPref
              }),
            },
            {
              hide: this.config?.hideUserData,
              headerName: 'Owned',
              headerTooltip: 'Number of items currently owned',
              valueGetter: this.valueGetter(({ data }) => this.nw.itemPref.get(data.ItemID)?.stock),
              cellRenderer: TrackingCell,
              cellRendererParams: TrackingCell.params({
                getId: (value: ItemDefinitionMasterWithPerks) => getItemId(value),
                pref: this.nw.itemPref,
                mode: 'stock',
                class: 'text-right',
              }),
              width: 90,
            },
            {
              hide: this.config?.hideUserData,
              headerName: 'GS',
              headerTooltip: 'Item owned with this gear score',
              valueGetter: this.valueGetter(({ data }) => this.nw.itemPref.get(data.ItemID)?.gs),
              cellRenderer: TrackingCell,
              cellRendererParams: TrackingCell.params({
                getId: (value: ItemDefinitionMasterWithPerks) => getItemId(value),
                pref: this.nw.itemPref,
                mode: 'gs',
              }),
              width: 90,
            },
            {
              hide: this.config?.hideUserData,
              headerName: 'Price',
              headerTooltip: 'Current price in Trading post',
              cellClass: 'text-right',
              valueGetter: this.valueGetter(({ data }) => this.nw.itemPref.get(data.ItemID)?.price),
              cellRenderer: TrackingCell,
              cellRendererParams: TrackingCell.params({
                getId: (value: ItemDefinitionMasterWithPerks) => getItemId(value),
                pref: this.nw.itemPref,
                mode: 'price',
                formatter: this.moneyFormatter,
              }),
              width: 100,
            },
          ],
        },
        {
          width: 120,
          headerName: 'Gear Score',
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
        },
        {
          headerName: 'Item Source',
          field: '$source',
          width: 125,
          filter: SelectboxFilter,
        },
        {
          field: this.fieldName('ItemType'),
          width: 125,
          filter: SelectboxFilter,
          getQuickFilterText: ({ value }) => value,
        },
        {
          width: 250,
          field: this.fieldName('ItemClass'),
          cellRenderer: this.cellRendererTags(humanize),
          filter: SelectboxFilter,
          filterParams: SelectboxFilter.params({
            showCondition: true,
            conditionAND: false,
            showSearch: true
          })
        },
        {
          field: this.fieldName('TradingGroup'),
          valueFormatter: ({ value }) => humanize(value),
          filter: SelectboxFilter,
          filterParams: SelectboxFilter.params({
            showSearch: true
          })
        },
        {
          width: 125,
          field: this.fieldName('TradingFamily'),
          valueFormatter: ({ value }) => humanize(value),
          filter: SelectboxFilter,
          filterParams: SelectboxFilter.params({
            showSearch: true
          })
        },
        {
          width: 125,
          field: this.fieldName('TradingCategory'),
          valueFormatter: ({ value }) => humanize(value),
          filter: SelectboxFilter,
        },
      ],
    }
  ))

  public entities: Observable<ItemDefinitionMasterWithPerks[]> = defer(() => {
    return combineLatest({
      items: this.config?.source || this.nw.db.items,
      perks: this.nw.db.perksMap,
    })
      .pipe(map(({ items, perks }) => {
        return items.map((it): ItemDefinitionMasterWithPerks => {
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

  public override setActiveCategories(grid: AgGridComponent, value: string[]): void {
    //
  }

  public constructor(
    private nw: NwService,
    private i18n: TranslateService,
    @Optional()
    private config: ItemsTableAdapterConfig,
  ) {
    super()
  }
}
