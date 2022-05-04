import { Injectable } from '@angular/core'
import { ColDef, GridOptions } from 'ag-grid-community'
import { groupBy } from 'lodash'
import { combineLatest, defer, map, Observable, shareReplay } from 'rxjs'
import { LocaleService } from '~/core/i18n'
import { IconComponent, NwService } from '~/core/nw'
import { CategoryFilter, mithrilCell } from '~/ui/ag-grid'
import { DataTableAdapter } from '~/ui/data-table'
import { Armorset } from './types'
import { findSets } from './utils'
import m from 'mithril'
import { ItemTrackerCell } from '~/widgets/item-tracker'

function fieldName(key: keyof Armorset) {
  return key
}

function field<K extends keyof Armorset>(item: Armorset, key: K): Armorset[K] {
  return item[key]
}

@Injectable()
export class ArmorsetsAdapterService extends DataTableAdapter<Armorset> {
  public entityID(item: Armorset): string {
    return item.key
  }

  public entityCategory(item: Armorset): string {
    return item.source
  }

  public buildGridOptions(base: GridOptions): GridOptions {
    const nw = this.nw
    return this.nw.gridOptions({
      ...base,
      rowSelection: 'single',
      columnDefs: [
        {
          headerName: 'Name',
          field: fieldName('name'),
          width: 200,
        },
        {
          headerName: 'Tier',
          width: 60,
          valueGetter: ({ data }) => this.nw.tierToRoman(field(data, 'tier')),
          filter: CategoryFilter,
        },
        {
          headerName: 'Weight',
          width: 80,
          field: fieldName('weight'),
          filter: CategoryFilter,
        },
        {
          headerName: 'Common Perks',
          width: 150,
          cellRenderer: mithrilCell<Armorset>({
            view: ({ attrs: { data } }) => {
              return m('div.flex.flex-row.items-center.h-full', {}, [
                m.fragment(
                  {},
                  data.perks.map((perk) => {
                    return m('a.block.w-7.h-7', { target: '_blank', href: this.nw.nwdbUrl('perk', perk.PerkID) }, [
                      m(IconComponent, {
                        src: this.nw.iconPath(perk.IconPath),
                        class: `w-7 h-7 nw-icon`,
                      }),
                    ])
                  })
                ),
              ])
            },
          }),
        },
        ...new Array(5).fill(null).map((_, i): ColDef[] => [
          {
            sortable: false,
            filter: false,
            width: 54,
            cellRenderer: mithrilCell<Armorset>({
              view: ({ attrs: { data } }) => {
                const item = data.items[i]
                const rarity = this.nw.itemRarity(item)
                return m('a', { target: '_blank', href: this.nw.nwdbUrl('item', item.ItemID) }, [
                  m(IconComponent, {
                    src: this.nw.iconPath(item.IconPath),
                    class: `w-9 h-9 nw-icon bg-rarity-${rarity}`
                  })
                ])
              },
            }),
          },
          {
            width: 150,
            editable: true,
            sortable: false,
            filter: false,
            getQuickFilterText: ({ data }) => {
              const item = (data as Armorset).items[i]
              return this.nw.translate(item.Name)
            },
            valueGetter: ({ data }) => {
              const item = (data as Armorset).items[i]
              return this.nw.itemPref.get(item.ItemID)?.gs
            },
            cellRenderer: mithrilCell<Armorset>({
              view: ({ attrs: { value, data } }) => {
                const item = data.items[i]
                const name = data.itemNames[i]
                const max = (item.GearScoreOverride || item.MaxGearScore) <= value
                return m('div.flex.flex-col.text-sm.font-bold', {
                  class: [
                    value && max ? 'border-l-4 border-l-success pl-2 -ml-2 -mr-2' : '',
                    value && !max ? 'border-l-4 border-l-warning pl-2 -ml-2 -mr-2' : '',
                  ].join(' ')
                }, [
                  m('span', {
                    class: value ? '' : 'text-error-content',
                  }, name),
                  m(ItemTrackerCell, {
                    class: [
                      'self-start',
                      value && max ? 'text-success' : '',
                      value && !max ? 'text-warning' : '',
                      !value ? 'text-error' : '',
                    ].join(' '),
                    itemId: item.ItemID,
                    meta: this.nw.itemPref,
                    mode: 'gs',
                    emptyTip: '',
                  }),
                ])
              },
            }),
          },
        ]).flat(1),
      ],
    })
  }

  public entities: Observable<Armorset[]> = defer(() => {
    return combineLatest({
      items: this.nw.db.items,
      perks: this.nw.db.perksMap,
      locale: this.locale.change,
    }).pipe(
      map(({ items, perks }) => {
        const MIN_RARITY = 2
        items = items.filter((it) => it.ItemType === 'Armor').filter((it) => this.nw.itemRarity(it) >= MIN_RARITY)
        return Object.entries(groupBy(items, (it) => it['$source']))
          .map(([key, items]) => ({
            key: key,
            sets: findSets(items, key, perks, this.nw),
          }))
          .filter((group) => group.sets.length > 0)
          .map((it) => it.sets)
          .flat(1)
          .map((it) => it.sets)
          .flat(1)
      })
    )
  }).pipe(
    shareReplay({
      refCount: true,
      bufferSize: 1,
    })
  )

  public constructor(private nw: NwService, private locale: LocaleService) {
    super()
  }
}
