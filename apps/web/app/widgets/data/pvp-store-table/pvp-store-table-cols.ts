import {
  NW_FALLBACK_ICON,
  PvpStoreRow,
  PvpStoreTag,
  getItemIconPath,
  getItemId,
  getItemRarity,
  isItemArtifact,
  isItemNamed,
  isMasterItem,
} from '@nw-data/common'
import { GameEventData, HouseItems, MasterItemDefinitions, RewardTrackItemData } from '@nw-data/generated'
import { GridSelectFilterOption } from '~/ui/data/ag-grid/grid-select-filter/types'
import { TableGridUtils } from '~/ui/data/table-grid'
import { selectGameEventRewards } from '../game-event-detail/selectors'

export type PvpStoreTableUtils = TableGridUtils<PvpStoreTableRecord>
export type PvpStoreTableRecord = PvpStoreRow & {
  $item: MasterItemDefinitions | HouseItems
  $reward: RewardTrackItemData
  $gameEvent: GameEventData
}

export function pvpStoreColIcon(util: PvpStoreTableUtils) {
  return util.colDef({
    colId: 'icon',
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Icon',
    resizable: false,
    sortable: false,
    filter: false,
    pinned: true,
    width: 62,
    cellClass: ['overflow-visible'],
    cellRenderer: util.cellRenderer(({ data }) => {
      const item = data.$item
      if (item) {
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
            isArtifact: isMasterItem(data) && isItemArtifact(data),
            isNamed: isMasterItem(data) && isItemNamed(data),
            rarity: getItemRarity(item),
          }),
        )
      }
      if (data.$reward?.IconPath) {
        return util.elItemIcon({
          icon: data.$reward?.IconPath,
        })
      }
      const rewards = selectGameEventRewards(data.$gameEvent, null)
      if (rewards?.length) {
        return util.elItemIcon({
          icon: rewards[0]?.icon || NW_FALLBACK_ICON,
        })
      }
      return util.elItemIcon({
        icon: NW_FALLBACK_ICON,
      })
    }),
  })
}

export function pvpStoreColName(util: PvpStoreTableUtils) {
  return util.colDef<string>({
    colId: 'bucket',
    headerValueGetter: () => 'Bucket',
    width: 250,
    field: 'Bucket',
    ...util.selectFilter({
      order: 'asc',
    }),
  })
}

export function pvpStoreColColumn(util: PvpStoreTableUtils) {
  return util.colDef<number>({
    colId: 'clumn',
    headerValueGetter: () => 'Column',
    field: 'Column',
    getQuickFilterText: () => '',
    width: 130,
    ...util.selectFilter({
      order: 'asc',
    }),
  })
}

export function pvpStoreColItem(util: PvpStoreTableUtils) {
  return util.colDef<string>({
    colId: 'item',
    headerValueGetter: () => 'Item',
    valueGetter: ({ data }) => util.tl8(data.$item?.Name),
    getQuickFilterText: ({ data }) => util.tl8(data.$item?.Name),
    width: 250,
    ...util.selectFilter({
      order: 'asc',
    }),
  })
}

export function pvpStoreColMatchOne(util: PvpStoreTableUtils) {
  return util.colDef<boolean>({
    colId: 'matchOne',
    headerValueGetter: () => 'Match One',
    field: 'MatchOne',
    getQuickFilterText: () => '',
    width: 130,
  })
}

export function pvpStoreColBudgetContribution(util: PvpStoreTableUtils) {
  return util.colDef<number>({
    colId: 'budgetContribution',
    headerValueGetter: () => 'Budget Contribution',
    field: 'BudgetContribution',
    getQuickFilterText: () => '',
    width: 130,
    filter: 'agNumberColumnFilter',
    hide: true,
  })
}
export function pvpStoreColEntitlement(util: PvpStoreTableUtils) {
  return util.colDef<number>({
    colId: 'entitlement',
    headerValueGetter: () => 'Entitlement',
    field: 'Entitlement',
    getQuickFilterText: () => '',
    width: 130,
    filter: 'agNumberColumnFilter',
  })
}
export function pvpStoreColExcludeType(util: PvpStoreTableUtils) {
  return util.colDef<string>({
    colId: 'excludeTypeStage',
    headerValueGetter: () => 'ExcludeType',
    field: 'ExcludeTypeStage',
    getQuickFilterText: () => '',
    width: 130,
    ...util.selectFilter({
      order: 'asc',
    }),
  })
}
export function pvpStoreColGameEvent(util: PvpStoreTableUtils) {
  return util.colDef<string | number>({
    colId: 'gameEvent',
    headerValueGetter: () => 'Game Event',
    field: 'GameEvent',
    getQuickFilterText: () => '',
    width: 130,
  })
}
export function pvpStoreColRandomWeights(util: PvpStoreTableUtils) {
  return util.colDef<string | number>({
    colId: 'randomWeights',
    headerValueGetter: () => 'Random Weights',
    field: 'RandomWeights',
    getQuickFilterText: () => '',
    width: 130,
  })
}
export function pvpStoreColRewardId(util: PvpStoreTableUtils) {
  return util.colDef<string>({
    colId: 'rewardId',
    headerValueGetter: () => 'Reward Id',
    field: 'RewardId',
    getQuickFilterText: () => '',
    width: 200,
  })
}
export function pvpStoreColRewardName(util: PvpStoreTableUtils) {
  return util.colDef<string>({
    colId: 'rewardName',
    headerValueGetter: () => 'Reward Name',
    valueGetter: ({ data }) => util.tl8(data.$reward?.Name),
    width: 200,
  })
}
export function pvpStoreSelectOnceOnly(util: PvpStoreTableUtils) {
  return util.colDef<boolean>({
    colId: 'selectOnceOnly',
    headerValueGetter: () => 'Select Once Only',
    field: 'SelectOnceOnly',
    getQuickFilterText: () => '',
    width: 150,
  })
}
export function pvpStoreType(util: PvpStoreTableUtils) {
  return util.colDef<string>({
    colId: 'type',
    headerValueGetter: () => 'Type',
    field: 'Type',
    getQuickFilterText: () => '',
    width: 130,
    ...util.selectFilter({
      order: 'asc',
    }),
  })
}
export function pvpStoreColTags(util: PvpStoreTableUtils) {
  return util.colDef<PvpStoreTag[]>({
    colId: 'tags',
    headerValueGetter: () => 'Tags',
    valueGetter: ({ data }) => {
      return Array.from(data.Tags.values()).flat()
    },
    wrapText: true,
    autoHeight: true,
    cellRenderer: util.tagsRenderer({
      transform: (it) => {
        if (!it.Value) {
          return it.Name
        }
        if (it.Value.length === 1) {
          return [it.Name, it.Value[0]].join(': ')
        }
        return [it.Name, it.Value.join('-')].join(': ')
      },
    }),
    width: 300,
    ...util.selectFilter({
      getOptions: ({ data }) => {
        return Array.from(data.Tags.values())
          .flat()
          .map((it): GridSelectFilterOption => {
            return {
              id: it.Name,
              label: it.Name,
              mode: 'value',
            }
          })
      },
      valueMatcher: (filter, values) => {
        const id = filter.value
        const input: number = filter.data?.value
        return values.some((it) => {
          const tag = it as PvpStoreTag
          if (tag.Name !== id) {
            return false
          }
          if (!tag.Value) {
            return true
          }
          if (tag.Value.length === 1) {
            return input == null || input >= tag.Value[0]
          }
          const matchMin = input == null || input >= tag.Value[0]
          const matchMax = input == null || input <= tag.Value[1]
          return matchMin && matchMax
        })
      },
    }),
  })
}
