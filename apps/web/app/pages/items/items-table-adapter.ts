import { Injectable } from '@angular/core'
import { ItemDefinitionMaster, Perks } from '@nw-data/types'
import { GridOptions, ValueGetterParams } from 'ag-grid-community'
import { combineLatest, defer, map, Observable, shareReplay, Subject, takeUntil, tap } from 'rxjs'
import { IconComponent, nwdbLinkUrl, NwService } from '~/core/nw'
import { SelectboxFilter, mithrilCell, AgGridComponent, RangeFilter } from '~/ui/ag-grid'
import { DataTableAdapter } from '~/ui/data-table'
import m from 'mithril'
import { ItemMarkerCell, ItemTrackerCell, ItemTrackerFilter } from '~/widgets/item-tracker'
import { getItemPerkBucketIds, getItemPerks, getItemRarity, getItemRarityName, getItemTierAsRoman, getPerkAffixStat } from '~/core/nw/utils'
import { TranslateService } from '~/core/i18n'
import { humanize, shareReplayRefCount } from '~/core/utils'

type ItemDefinitionMasterWithPerks = ItemDefinitionMaster & {
  $perks: Perks[]
}

@Injectable()
export class ItemsTableAdapter extends DataTableAdapter<ItemDefinitionMasterWithPerks> {
  public entityID(item: ItemDefinitionMasterWithPerks): string {
    return item.ItemID
  }

  public entityCategory(item: ItemDefinitionMasterWithPerks): string {
    return item.ItemType
  }

  public buildGridOptions(base: GridOptions): GridOptions {
    return {
      ...base,
      rowSelection: 'single',
      columnDefs: [
        {
          sortable: false,
          filter: false,
          width: 54,
          pinned: true,
          cellRenderer: this.mithrilCell({
            view: ({ attrs: { data } }) =>
              m('a', { target: '_blank', href: nwdbLinkUrl('item', data.ItemID) }, [
                m(IconComponent, {
                  src: data.IconPath,
                  class: `w-9 h-9 nw-icon bg-rarity-${getItemRarity(data)}`,
                }),
              ]),
          }),
        },
        {
          width: 250,
          headerName: 'Name',
          valueGetter: this.valueGetter(({ data }) => this.i18n.get(data.Name)),
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
          cellRenderer: this.mithrilCell({
            view: ({ attrs: { data } }) => {
              const perks = data.$perks || []
              const generated = getItemPerkBucketIds(data)
              const buckets = getItemPerkBucketIds(data)
              return m('div.flex.flex-row.items-center.h-full', {}, [
                m.fragment(
                  {},
                  perks.map((perk) =>
                    m('a.block.w-7.h-7', { target: '_blank', href: nwdbLinkUrl('perk', perk.PerkID) }, [
                      m(IconComponent, {
                        src: perk.IconPath,
                        class: `w-7 h-7 nw-icon`,
                      }),
                    ])
                  )
                ),
                m.fragment(
                  {},
                  generated.map(() =>
                    m(IconComponent, {
                      src: 'assets/icons/crafting_perkbackground.png',
                      class: `w-7 h-7 nw-icon`,
                    })
                  )
                ),
              ])
            },
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
              width: 100,
              headerName: 'Bookmark',
              cellClass: 'cursor-pointer',
              filter: ItemTrackerFilter,
              valueGetter: this.valueGetter(({ data }) => this.nw.itemPref.get(data.ItemID)?.mark || 0),
              cellRenderer: this.mithrilCell({
                view: ({ attrs: { data } }) => {
                  return m(ItemMarkerCell, {
                    itemId: data.ItemID,
                    meta: this.nw.itemPref,
                  })
                }
              })
            },
            {
              headerName: 'Owned',
              headerTooltip: 'Number of items currently owned',
              valueGetter: this.valueGetter(({ data }) => this.nw.itemPref.get(data.ItemID)?.stock),
              cellRenderer: this.mithrilCell({
                view: ({ attrs: { data } }) => {
                  return m(ItemTrackerCell, {
                    itemId: data.ItemID,
                    meta: this.nw.itemPref,
                    mode: 'stock',
                    class: 'text-right',
                  })
                },
              }),
              width: 90,
            },
            {
              headerName: 'GS',
              headerTooltip: 'Item owned with this gear score',
              valueGetter: this.valueGetter(({ data }) => this.nw.itemPref.get(data.ItemID)?.gs),
              cellRenderer: this.mithrilCell({
                view: ({ attrs: { data } }) => {
                  return m(ItemTrackerCell, {
                    itemId: data.ItemID,
                    meta: this.nw.itemPref,
                    mode: 'gs',
                    class: 'text-right',
                  })
                },
              }),
              width: 90,
            },
            {
              headerName: 'Price',
              headerTooltip: 'Current price in Trading post',
              cellClass: 'text-right',
              valueGetter: this.valueGetter(({ data }) => this.nw.itemPref.get(data.ItemID)?.price),
              cellRenderer: this.mithrilCell({
                view: ({ attrs: { data } }) => {
                  return m(ItemTrackerCell, {
                    itemId: data.ItemID,
                    meta: this.nw.itemPref,
                    mode: 'price',
                    class: 'text-right',
                    formatter: this.moneyFormatter,
                  })
                },
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
            let min = data.MinGearScore
            let max = data.MaxGearScore
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
  }

  public entities: Observable<ItemDefinitionMasterWithPerks[]> = defer(() => {
    return combineLatest({
      items: this.nw.db.items,
      perks: this.nw.db.perksMap,
    })
      .pipe(tap(({ perks }) => (this.perks = perks)))
      .pipe(map(({ items }) => {
        return items.map((it): ItemDefinitionMasterWithPerks => {
          return {
            ...it,
            $perks: getItemPerks(it, this.perks)
          }
        })
      }))
  }).pipe(
    shareReplayRefCount(1)
  )

  public override setActiveCategories(grid: AgGridComponent, value: string[]): void {
    //
  }

  private perks: Map<string, Perks>

  public constructor(private nw: NwService, private i18n: TranslateService) {
    super()
  }
}
