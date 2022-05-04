import { Injectable } from '@angular/core'
import { ItemDefinitionMaster, Perks } from '@nw-data/types'
import { GridOptions, ValueGetterParams } from 'ag-grid-community'
import { combineLatest, defer, map, Observable, shareReplay, Subject, takeUntil, tap } from 'rxjs'
import { IconComponent, NwService } from '~/core/nw'
import { CategoryFilter, mithrilCell } from '~/ui/ag-grid'
import { DataTableAdapter } from '~/ui/data-table'
import m from 'mithril'
import { ItemTrackerCell } from '~/widgets/item-tracker'

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
              width: 80,
              headerName: 'Fav',
              cellClass: 'cursor-pointer',
              valueGetter: this.valueGetter(({ data }) => !!this.nw.itemPref.get(data.ItemID)?.fav),
              cellRenderer: mithrilCell<ItemDefinitionMaster, { destroy: Subject<any> }>({
                oncreate: ({ attrs, state }) => {
                  state.destroy = new Subject()
                  this.nw.itemPref
                    .observe(attrs.data.ItemID)
                    .pipe(takeUntil(state.destroy))
                    .subscribe(() => {
                      attrs.api.refreshCells({
                        rowNodes: [attrs.node],
                      })
                    })
                },
                onremove: ({ state }) => {
                  state.destroy.next(null)
                  state.destroy.complete()
                },
                view: ({ attrs }) => {
                  const truIcon = `<svg class="block w-6 h-6 fill-primary" viewBox="0 0 576 512"><path d="M381.2 150.3L524.9 171.5C536.8 173.2 546.8 181.6 550.6 193.1C554.4 204.7 551.3 217.3 542.7 225.9L438.5 328.1L463.1 474.7C465.1 486.7 460.2 498.9 450.2 506C440.3 513.1 427.2 514 416.5 508.3L288.1 439.8L159.8 508.3C149 514 135.9 513.1 126 506C116.1 498.9 111.1 486.7 113.2 474.7L137.8 328.1L33.58 225.9C24.97 217.3 21.91 204.7 25.69 193.1C29.46 181.6 39.43 173.2 51.42 171.5L195 150.3L259.4 17.97C264.7 6.954 275.9-.0391 288.1-.0391C300.4-.0391 311.6 6.954 316.9 17.97L381.2 150.3z"/></svg>`
                  const falseIcon = `<svg class="block w-6 h-6 fill-primary opacity-50" viewBox="0 0 576 512"><path d="M287.9 0C297.1 0 305.5 5.25 309.5 13.52L378.1 154.8L531.4 177.5C540.4 178.8 547.8 185.1 550.7 193.7C553.5 202.4 551.2 211.9 544.8 218.2L433.6 328.4L459.9 483.9C461.4 492.9 457.7 502.1 450.2 507.4C442.8 512.7 432.1 513.4 424.9 509.1L287.9 435.9L150.1 509.1C142.9 513.4 133.1 512.7 125.6 507.4C118.2 502.1 114.5 492.9 115.1 483.9L142.2 328.4L31.11 218.2C24.65 211.9 22.36 202.4 25.2 193.7C28.03 185.1 35.5 178.8 44.49 177.5L197.7 154.8L266.3 13.52C270.4 5.249 278.7 0 287.9 0L287.9 0zM287.9 78.95L235.4 187.2C231.9 194.3 225.1 199.3 217.3 200.5L98.98 217.9L184.9 303C190.4 308.5 192.9 316.4 191.6 324.1L171.4 443.7L276.6 387.5C283.7 383.7 292.2 383.7 299.2 387.5L404.4 443.7L384.2 324.1C382.9 316.4 385.5 308.5 391 303L476.9 217.9L358.6 200.5C350.7 199.3 343.9 194.3 340.5 187.2L287.9 78.95z"/></svg>`
                  return m(
                    'div.h-full.flex.items-center',
                    {
                      onclick: () => {
                        this.nw.itemPref.toggleFavourite(attrs.data.ItemID)
                        attrs.api.refreshCells({
                          rowNodes: [attrs.node],
                        })
                      },
                    },
                    [m.trust(attrs.value ? truIcon : falseIcon)]
                  )
                },
              }),
            },
            {
              headerName: 'Stock',
              headerTooltip: 'Number of items currently owned',
              cellRenderer: this.mithrilCell({
                view: ({ attrs: { data } }) => {
                  return m(ItemTrackerCell, {
                    itemId: data.ItemID,
                    meta: this.nw.itemPref,
                    mode: 'stock',
                  })
                },
              }),
              width: 90,
            },
            {
              headerName: 'GS',
              headerTooltip: 'Item owned with this gear score',
              cellRenderer: this.mithrilCell({
                view: ({ attrs: { data } }) => {
                  return m(ItemTrackerCell, {
                    itemId: data.ItemID,
                    meta: this.nw.itemPref,
                    mode: 'gs',
                  })
                },
              }),
              width: 90,
            },
            {
              headerName: 'Price',
              headerTooltip: 'Current price in Trading post',
              cellClass: 'text-right',
              cellRenderer: this.mithrilCell({
                view: ({ attrs: { data } }) => {
                  return m(ItemTrackerCell, {
                    itemId: data.ItemID,
                    meta: this.nw.itemPref,
                    mode: 'price',
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
