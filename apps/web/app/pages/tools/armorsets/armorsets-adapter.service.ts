import { Injectable } from '@angular/core'
import { ColDef, GridOptions } from 'ag-grid-community'
import { groupBy } from 'lodash'
import m from 'mithril'
import { combineLatest, defer, map, merge, Observable, of, takeUntil } from 'rxjs'
import { TranslateService } from '~/i18n'
import { IconComponent, NwLinkService, NwService } from '~/nw'
import { getItemIconPath, getItemRarity, getItemTierAsRoman, isItemNamed } from '~/nw/utils'
import { mithrilCell, SelectFilter } from '~/ui/ag-grid'
import { DataTableAdapter, dataTableProvider } from '~/ui/data-table'
import { LayoutService } from '~/ui/layout'
import { shareReplayRefCount } from '~/utils'
import { ItemTrackerCell } from '~/widgets/item-tracker'
import { Armorset } from './types'
import { findSets } from './utils'

function fieldName(key: keyof Armorset) {
  return key
}

function field<K extends keyof Armorset>(item: Armorset, key: K): Armorset[K] {
  return item[key]
}

@Injectable()
export class ArmorsetsAdapterService extends DataTableAdapter<Armorset> {
  public static provider() {
    return dataTableProvider({
      adapter: ArmorsetsAdapterService,
    })
  }

  public entityID(item: Armorset): string {
    return item.key
  }

  public entityCategory(item: Armorset): string {
    return item.source
  }

  public options = defer(() =>
    of<GridOptions>({
      rowSelection: 'single',
      columnDefs: [
        {
          headerName: 'Name',
          field: fieldName('name'),
          width: 200,
          pinned: !this.layout.isHandset,
        },
        {
          headerName: 'Tier',
          width: 60,
          valueGetter: ({ data }) => getItemTierAsRoman(field(data, 'tier')),
          filter: SelectFilter,
        },
        {
          headerName: 'Weight',
          width: 80,
          field: fieldName('weight'),
          filter: SelectFilter,
        },
        {
          headerName: 'Common Perks',
          width: 110,
          valueGetter: this.valueGetter(({ data }) => data.perks?.map((it) => it.PerkID)),
          cellRenderer: mithrilCell<Armorset>({
            view: ({ attrs: { data } }) => {
              return m('div.flex.flex-row.items-center.h-full', {}, [
                m.fragment(
                  {},
                  data.perks.map((perk) => {
                    return m('a.block.w-8.h-8', { target: '_blank', href: this.info.link('perk', perk.PerkID) }, [
                      m(IconComponent, {
                        src: perk.IconPath,
                        class: `w-8 h-8 nw-icon`,
                      }),
                    ])
                  })
                ),
              ])
            },
          }),
          filter: SelectFilter,
          filterParams: SelectFilter.params({
            showSearch: true,
            optionsGetter: (node) => {
              const perks = (node.data as Armorset).perks || []
              return perks.map((perk) => {
                return {
                  id: perk.PerkID,
                  label: this.i18n.get(perk.DisplayName || perk.AppliedSuffix || perk.AppliedPrefix),
                  icon: perk.IconPath,
                }
              })
            },
          }),
        },
        ...new Array(5)
          .fill(null)
          .map((_, i): ColDef[] => [
            {
              sortable: false,
              filter: false,
              width: 62,
              cellRenderer: this.cellRenderer(({ data }) => {
                const item = data.items[i]
                return this.createLinkWithIcon({
                  href: this.info.link('item', item.ItemID),
                  target: '_blank',
                  icon: getItemIconPath(item),
                  rarity: getItemRarity(item),
                  named: isItemNamed(item),
                  iconClass: ['transition-all', 'translate-x-0', 'hover:translate-x-1'],
                })
              }),
            },
            {
              width: 150,
              sortable: false,
              filter: false,
              getQuickFilterText: ({ data }) => {
                const item = (data as Armorset).items[i]
                return this.i18n.get(item.Name)
              },
              valueGetter: ({ data }) => {
                const item = (data as Armorset).items[i]
                return this.nw.itemPref.get(item.ItemID)?.gs
              },
              cellRenderer: mithrilCell<Armorset>({
                oncreate: ({ attrs: { data, destroy$, api, node } }) => {
                  merge(...data.items.map((it) => this.nw.itemPref.observe(it.ItemID)))
                    .pipe(takeUntil(destroy$))
                    .subscribe(() => {
                      api.refreshCells({ rowNodes: [node] })
                    })
                },
                view: ({ attrs: { value, data } }) => {
                  const item = data.items[i]
                  const name = data.itemNames[i]
                  const max = (item.GearScoreOverride || item.MaxGearScore) <= value
                  return m(
                    'div.flex.flex-col.text-sm',
                    {
                      class: [
                        value && max ? 'border-l-4 border-l-success pl-2 -ml-2 -mr-2' : '',
                        value && !max ? 'border-l-4 border-l-warning pl-2 -ml-2 -mr-2' : '',
                      ].join(' '),
                    },
                    [
                      m(
                        'span',
                        {
                          class: value ? '' : 'text-error-content',
                        },
                        name
                      ),
                      m(ItemTrackerCell, {
                        class: [
                          'self-start',
                          value && max ? 'text-success' : '',
                          value && !max ? 'text-warning' : '',
                        ].join(' '),
                        itemId: item.ItemID,
                        meta: this.nw.itemPref,
                        mode: 'gs',
                        emptyTip: '',
                      }),
                    ]
                  )
                },
              }),
            },
          ])
          .flat(1),
      ],
    })
  )

  public entities: Observable<Armorset[]> = defer(() => {
    return combineLatest({
      items: this.nw.db.items,
      perks: this.nw.db.perksMap,
    }).pipe(
      map(({ items, perks }) => {
        const MIN_RARITY = 2
        items = items.filter((it) => it.ItemType === 'Armor').filter((it) => getItemRarity(it) >= MIN_RARITY)
        return Object.entries(groupBy(items, (it) => it['$source']))
          .map(([key, items]) => ({
            key: key,
            sets: findSets(items, key, perks, this.i18n),
          }))
          .filter((group) => group.sets.length > 0)
          .map((it) => it.sets)
          .flat(1)
          .map((it) => it.sets)
          .flat(1)
      })
    )
  }).pipe(shareReplayRefCount(1))

  public constructor(
    private nw: NwService,
    private i18n: TranslateService,
    private layout: LayoutService,
    private info: NwLinkService
  ) {
    super()
  }
}
