import {
  NW_FALLBACK_ICON,
  getItemIconPath,
  getItemId,
  getItemRarity,
  getSeasonPassDataId,
  isItemArtifact,
  isItemNamed,
  isMasterItem,
} from '@nw-data/common'
import { HouseItems, MasterItemDefinitions, SeasonPassRankData } from '@nw-data/generated'
import { TableGridUtils } from '~/ui/data/table-grid'

export type SeasonPassTableUtils = TableGridUtils<SeasonPassTableRecord>
export type SeasonPassTableRecord = SeasonPassRankData & {
  $source: string
  $freeItem: MasterItemDefinitions | HouseItems
  $premiumItem: MasterItemDefinitions | HouseItems
}

export function seasonPassColID(util: SeasonPassTableUtils) {
  return util.colDef<string>({
    colId: 'id',
    headerValueGetter: () => 'ID',
    width: 200,
    hide: true,
    valueGetter: ({ data }) => getSeasonPassDataId(data),
    getQuickFilterText: ({ value }) => value,
  })
}

export function seasonPassColLevel(util: SeasonPassTableUtils) {
  return util.colDef<number>({
    colId: 'level',
    headerValueGetter: () => 'Level',
    valueGetter: ({ data }) => data.Level,
  })
}

export function seasonPassColSeason(util: SeasonPassTableUtils) {
  return util.colDef<string>({
    colId: 'source',
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Season',
    valueGetter: ({ data }) => data.$source,
  })
}

export function seasonPassColFreeItem(util: SeasonPassTableUtils) {
  return util.colDef({
    colId: 'freeTrackItem',
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Free Track Item',
    resizable: true,
    sortable: false,
    filter: false,
    width: 300,
    cellClass: ['overflow-visible'],
    cellRenderer: util.cellRenderer(({ data }) => {
      const item = data.$freeItem
      if (!item) {
        return null
      }
      return util.el('div.flex.flex-row.gap-2', {}, [
        util.elA(
          {
            attrs: {
              href: util.tipLink('item', getItemId(item)),
              target: '_blank',
            },
          },
          util.elItemIcon({
            class: ['transition-all translate-x-0 hover:translate-x-1'],
            icon: getItemIconPath(item) || NW_FALLBACK_ICON,
            isArtifact: isMasterItem(item) && isItemArtifact(item),
            isNamed: isMasterItem(item) && isItemNamed(item),
            rarity: getItemRarity(item),
          }),
        ),
        util.el('span.flex.items-center.whitespace-break-spaces', {
          text: util.tl8(item.Name),
        }),
      ])
    }),
  })
}

export function seasonPassColPremiumItem(util: SeasonPassTableUtils) {
  return util.colDef({
    colId: 'premiumTrackItem',
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Premium Track Item',
    resizable: true,
    sortable: false,
    filter: false,
    width: 300,
    cellClass: ['overflow-visible'],
    cellRenderer: util.cellRenderer(({ data }) => {
      const item = data.$premiumItem
      if (!item) {
        return null
      }
      return util.el('div.flex.flex-row.gap-2', {}, [
        util.elA(
          {
            attrs: {
              href: util.tipLink('item', getItemId(item)),
              target: '_blank',
            },
          },
          util.elItemIcon({
            class: ['transition-all translate-x-0 hover:translate-x-1'],
            icon: getItemIconPath(item) || NW_FALLBACK_ICON,
            isArtifact: isMasterItem(item) && isItemArtifact(item),
            isNamed: isMasterItem(item) && isItemNamed(item),
            rarity: getItemRarity(item),
          }),
        ),
        util.el('span.flex.items-center.whitespace-break-spaces', {
          text: util.tl8(item.Name),
        }),
      ])
    }),
  })
}
