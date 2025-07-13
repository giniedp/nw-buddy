import {
  NW_FALLBACK_ICON,
  getItemIconPath,
  getItemId,
  getItemRarity,
  getItemTierAsRoman,
  isItemArtifact,
  isItemNamed,
} from '@nw-data/common'
import m from 'mithril'
import { merge, skip, takeUntil } from 'rxjs'
import { mithrilCell } from '~/ui/data/ag-grid'
import { TableGridUtils } from '~/ui/data/table-grid'
import { ItemMarkerCell } from '~/widgets/item-tracker'
import { Armorset } from '../types'

export type ArmorsetGridUtils = TableGridUtils<ArmorsetGridRecord>
export type ArmorsetGridRecord = Armorset

export function armorsetColName(util: ArmorsetGridUtils) {
  return util.colDef({
    colId: 'name',
    headerValueGetter: () => 'Name',
    valueGetter: util.fieldGetter('name'),
    width: 200,
    pinned: true,
    // pinned: !util.layout.isHandset,
  })
}

export function armorsetColTier(util: ArmorsetGridUtils) {
  return util.colDef({
    colId: 'tier',
    headerValueGetter: () => 'Tier',
    valueGetter: util.fieldGetter('tier', getItemTierAsRoman),
    width: 60,
    ...util.selectFilter({
      order: 'asc',
    }),
  })
}

export function armorsetColWeight(util: ArmorsetGridUtils) {
  return util.colDef({
    colId: 'weight',
    headerValueGetter: () => 'Weight',
    valueGetter: util.fieldGetter('weight'),
    width: 80,
    ...util.selectFilter({
      order: 'asc',
    }),
  })
}
export function armorsetColPerks(util: ArmorsetGridUtils) {
  return util.colDef<string[]>({
    colId: 'perks',
    headerValueGetter: () => 'Common Perks',
    valueGetter: ({ data }) => data.perks?.map((it) => it.PerkID),
    width: 110,
    cellRenderer: util.cellRenderer(({ data }) => {
      return util.el(
        'div.flex.flex-row',
        {},
        data.perks.map((perk) => {
          return util.elA(
            {
              attrs: {
                href: util.tipLink('perk', perk?.PerkID),
                target: '_blank',
              },
            },
            util.elItemIcon({
              class: ['w-8 h-8 transition-all translate-x-0 hover:translate-x-1'],
              icon: perk?.IconPath || NW_FALLBACK_ICON,
            }),
          )
        }),
      )
    }),
  })
}

export function armorsetColItem(util: ArmorsetGridUtils, index: number) {
  return util.colDef({
    headerValueGetter: () => '',
    colId: `item-${index}`,
    sortable: false,
    filter: false,
    width: 70,
    cellRenderer: util.cellRenderer(({ data }) => {
      const item = data.items[index]
      return util.elA(
        {
          attrs: {
            href: util.tipLink('item', getItemId(item)),
            target: '_blank',
          },
        },
        util.elItemIcon({
          class: ['transition-all translate-x-0 hover:translate-x-1'],
          icon: getItemIconPath(item) || NW_FALLBACK_ICON,
          rarity: getItemRarity(item),
          isNamed: isItemNamed(item),
          isArtifact: isItemArtifact(item),
        }),
      )
    }),
  })
}

export function armorsetColItemTrack(util: ArmorsetGridUtils, index: number) {
  return util.colDef({
    colId: `item-track-${index}`,
    headerValueGetter: () => '',
    width: 150,
    sortable: false,
    filter: false,
    getQuickFilterText: ({ data }) => {
      const item = (data as Armorset).items[index]
      return util.i18n.get(item.Name)
    },
    valueGetter: ({ data }) => {
      const item = (data as Armorset).items[index]
      return util.character.getItemGearScore(item.ItemID)
    },
    cellRenderer: mithrilCell<Armorset>({
      oncreate: ({ attrs: { data, destroy$, api, node } }) => {
        merge(...data.items.map((it) => util.character.observeItemGearScore(it.ItemID).pipe(skip(1))))
          .pipe(takeUntil(destroy$))
          .subscribe(() => {
            api.refreshCells({ rowNodes: [node] })
          })
      },
      view: ({ attrs: { value, data } }) => {
        const item = data.items[index]
        const name = data.itemNames[index]
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
              name,
            ),
            m('div.flex.flex-row.gap-1', [
              m(ItemMarkerCell, {
                class: [value && max ? 'text-success' : '', value && !max ? 'text-warning' : ''].join(' '),
                itemId: item.ItemID,
                char: util.character,
                disabled: true,
              }),
            ]),
          ],
        )
      },
    }),
  })
}
