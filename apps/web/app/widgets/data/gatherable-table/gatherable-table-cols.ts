import { NumberFilter } from '@ag-grid-community/core'
import { LootTableRow, NW_FALLBACK_ICON, getItemExpansion } from '@nw-data/common'
import { Gatherables } from '@nw-data/generated'
import { SelectFilter } from '~/ui/data/ag-grid'
import { TableGridUtils } from '~/ui/data/table-grid'

export type GatherableTableUtils = TableGridUtils<GatherableTableRecord>
export type GatherableTableRecord = Gatherables

export function gatherableColIcon(util: GatherableTableUtils) {
  return util.colDef({
    colId: 'icon',
    headerValueGetter: () => 'Icon',
    getQuickFilterText: () => '',
    resizable: false,
    sortable: false,
    filter: false,
    pinned: true,
    width: 62,
    cellClass: ['overflow-visible'],
    cellRenderer: util.cellRenderer(({ data }) => {
      return util.elA(
        {
          attrs: {
            href: util.tipLink('gatherable', data.GatherableID),
            target: '_blank',
          },
        },
        util.elItemIcon({
          class: ['transition-all translate-x-0 hover:translate-x-1'],
          icon: NW_FALLBACK_ICON,
        })
      )
    }),
  })
}

export function gatherableColName(util: GatherableTableUtils) {
  return util.colDef<string>({
    colId: 'displayName',
    headerValueGetter: () => 'Name',
    sortable: true,
    filter: true,
    width: 250,
    valueGetter: ({ data }) => {
      let name = util.i18n.get(data.DisplayName)
      const size = data.FinalLootTable?.match(/(Tiny|Small|Medium|Large|Huge)/)?.[1]
      if (size) {
        name = `${name} - ${size}`
      }
      return name
    },
    cellRenderer: util.cellRenderer(({ value }) => util.lineBreaksToHtml(value)),
    cellClass: ['multiline-cell', 'py-2'],
    autoHeight: true,
    getQuickFilterText: ({ value }) => value,
  })
}

export function gatherableColID(util: GatherableTableUtils) {
  return util.colDef<string>({
    colId: 'gatherableId',
    headerValueGetter: () => 'Gatherable ID',
    field: 'GatherableID',
    hide: true,
  })
}

export function gatherableColTradeSkill(util: GatherableTableUtils) {
  return util.colDef<string>({
    colId: 'tradeSkill',
    headerValueGetter: () => 'Trade Skill',
    width: 120,
    field: 'Tradeskill',
    filter: SelectFilter,
  })
}

export function gatherableColLootTable(util: GatherableTableUtils) {
  return util.colDef<string>({
    colId: 'finalLootTable',
    headerValueGetter: () => 'Loot Table',
    width: 120,
    field: 'FinalLootTable',
    filter: SelectFilter,
    filterParams: SelectFilter.params({
      showSearch: true
    })
  })
}


export function gatherableColGatherTime(util: GatherableTableUtils) {
  return util.colDef<number>({
    colId: 'baseGatherTime',
    headerValueGetter: () => 'Gather Time',
    getQuickFilterText: () => '',
    width: 150,
    field: 'BaseGatherTime',
    valueFormatter: ({ value }) => secondsToDuration(value),
    filter: NumberFilter,
  })
}
export function gatherableColMinRespawnTime(util: GatherableTableUtils) {
  return util.colDef<number>({
    colId: 'minRespawnRate',
    headerValueGetter: () => 'Min Respawn Rate',
    getQuickFilterText: () => '',
    width: 150,
    field: 'MinRespawnRate',
    valueFormatter: ({ value }) => secondsToDuration(value),
    filter: NumberFilter,
  })
}

export function gatherableColMaxRespawnTime(util: GatherableTableUtils) {
  return util.colDef<number>({
    colId: 'maxRespawnRate',
    headerValueGetter: () => 'Max Respawn Rate',
    getQuickFilterText: () => '',
    width: 150,
    valueGetter: ({ data }) => data.MaxRespawnRate,
    valueFormatter: ({ value }) => secondsToDuration(value),
    filter: NumberFilter,
  })
}


export function gatherableColExpansion(util: GatherableTableUtils) {
  return util.colDef<string>({
    colId: 'expansionIdUnlock',
    headerValueGetter: () => 'Expansion',
    width: 190,
    valueGetter: ({ data}) => util.i18n.get(getItemExpansion(data?.ExpansionIdUnlock)?.label) ,
    cellRenderer: util.cellRenderer(({ data }) => {
      const expansion = getItemExpansion(data?.ExpansionIdUnlock)
      if (!expansion) {
        return null
      }
      //return `"${data.RequiredExpansion}"`
      return util.el('div.flex.flex-row.gap-1.items-center', {}, [
        util.elImg({
          class: ['w-6', 'h-6'],
          src: expansion.icon,
        }),
        util.el('span', { text: util.i18n.get(expansion.label) }),
      ])
    }),
    filter: SelectFilter,
    filterParams: SelectFilter.params<GatherableTableRecord>({
      optionsGetter: ({ data }) => {
        const it = getItemExpansion(data?.ExpansionIdUnlock)
        return it
          ? [
              {
                id: it.id,
                label: util.i18n.get(it.label),
                icon: it.icon,
              },
            ]
          : []
      },
    }),
  })
}
function secondsToDuration(value: number) {
  const milliseconds = Math.floor(value * 1000) % 1000
  const seconds = Math.floor(value % 60)
  const minutes = Math.floor(value / 60) % 60
  const hours = Math.floor(value / 3600) % 24
  const days = Math.floor(value / 86400)
  const result = []
  if (milliseconds) {
    result.push(`${milliseconds}ms`)
  }
  if (seconds) {
    result.push(`${seconds}s`)
  }
  if (minutes) {
    result.push(`${minutes}m`)
  }
  if (hours) {
    result.push(`${hours}h`)
  }
  if (days) {
    result.push(`${days}d`)
  }
  return result.reverse().join(' ')
}
