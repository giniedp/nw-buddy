import { Injectable } from '@angular/core'
import { ItemDefinitionMaster, Perks } from '@nw-data/types'
import { GridOptions, ValueGetterParams } from 'ag-grid-community'
import { combineLatest, defer, map, Observable, shareReplay, Subject, takeUntil, tap } from 'rxjs'
import { IconComponent, NwService } from '~/core/nw'
import { CategoryFilter, mithrilCell } from '~/ui/ag-grid'
import { DataTableAdapter } from '~/ui/data-table'
import m from 'mithril'
import { ItemMarkerCell, ItemTrackerCell, ItemTrackerFilter } from '~/widgets/item-tracker'

@Injectable()
export class ItemsTableAdapter extends DataTableAdapter<ItemDefinitionMaster> {
  public entityID(item: ItemDefinitionMaster): string {
    return item.ItemID
  }

  public entityCategory(item: ItemDefinitionMaster): string {
    return item.ItemType
  }

  public buildGridOptions(base: GridOptions): GridOptions {
    return this.nw.gridOptions({
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
              m('a', { target: '_blank', href: this.nw.nwdbUrl('item', data.ItemID) }, [
                m(IconComponent, {
                  src: this.nw.iconPath(data.IconPath),
                  class: `w-9 h-9 nw-icon bg-rarity-${this.nw.itemRarity(data)}`,
                }),
              ]),
          }),
        },
        {
          width: 250,
          headerName: 'Name',
          valueGetter: this.valueGetter(({ data }) => this.nw.translate(data.Name)),
          getQuickFilterText: ({ value }) => value,
        },
        {
          field: this.fieldName('ItemID'),
          hide: true,
        },
        {
          width: 175,
          filter: false,
          sortable: false,
          headerName: 'Perks',
          cellRenderer: this.mithrilCell({
            view: ({ attrs: { data } }) => {
              const perks = this.nw.itemPerks(data, this.perks)
              const generated = this.nw.itemPerkPerkBucketIds(data)
              return m('div.flex.flex-row.items-center.h-full', {}, [
                m.fragment(
                  {},
                  perks.map((perk) =>
                    m('a.block.w-7.h-7', { target: '_blank', href: this.nw.nwdbUrl('perk', perk.PerkID) }, [
                      m(IconComponent, {
                        src: this.nw.iconPath(perk.IconPath),
                        class: `w-7 h-7 nw-icon`,
                      }),
                    ])
                  )
                ),
                m.fragment(
                  {},
                  generated.map(() =>
                    m(IconComponent, {
                      src: '/nw-data/crafting/crafting_perkbackground.webp',
                      class: `w-7 h-7 nw-icon`,
                    })
                  )
                ),
              ])
            },
          }),
        },
        {
          headerName: 'Rarity',
          valueGetter: ({ data }) => this.nw.itemRarityName(data),
          filter: CategoryFilter,
          width: 130,
          getQuickFilterText: ({ value }) => value,
        },
        {
          width: 80,
          field: this.fieldName('Tier'),
          valueGetter: ({ data }) => this.nw.tierToRoman(data.Tier),
          filter: CategoryFilter,
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
              headerName: 'Stock',
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
                    formatter: this.nw.moneyFormatter,
                  })
                },
              }),
              width: 100,
            },
          ],
        },
        {
          headerName: 'GS',
          children: [
            {
              headerName: 'Min',
              cellClass: 'text-right',
              field: this.fieldName('MinGearScore'),
              width: 100,
            },
            {
              headerName: 'Max',
              cellClass: 'text-right',
              field: this.fieldName('MaxGearScore'),
              width: 100,
            },
          ],
        },
        {
          field: this.fieldName('ItemType'),
          width: 125,
          filter: CategoryFilter,
          getQuickFilterText: ({ value }) => value,
        },
        {
          width: 250,
          field: this.fieldName('ItemClass'),
          valueGetter: ({ data, colDef }) => {
            return (data[colDef.field] || '').trim().split('+')
          },
          cellRenderer: mithrilCell({
            view: ({ attrs: { value } }) => {
              return m(
                'div.flex.flex-row.flex-wrap.items-center.h-full',
                value.map((it: string) => {
                  return m('span.badge.badge-secondary.mr-1.badge-sm', it)
                })
              )
            },
          }),
          filter: CategoryFilter,
        },
        {
          field: this.fieldName('TradingGroup'),
          // width: 125,
          filter: CategoryFilter,
        },
        {
          field: this.fieldName('TradingFamily'),
          width: 125,
          filter: CategoryFilter,
        },
        {
          field: this.fieldName('TradingCategory'),
          width: 125,
          filter: CategoryFilter,
        },
      ],
    })
  }

  public entities: Observable<ItemDefinitionMaster[]> = defer(() => {
    return combineLatest({
      items: this.nw.db.items,
      perks: this.nw.db.perksMap,
    })
      .pipe(tap(({ perks }) => (this.perks = perks)))
      .pipe(map(({ items }) => items))
  }).pipe(
    shareReplay({
      refCount: true,
      bufferSize: 1,
    })
  )

  private perks: Map<string, Perks>

  public constructor(private nw: NwService) {
    super()
  }
}
