import { NumberFilter } from '@ag-grid-community/core'
import { NW_FALLBACK_ICON, getGatherableNodeSize, getItemExpansion } from '@nw-data/common'
import { Gatherables, GatherablesMetadata, Npc, VariationsGatherables, VariationsMetadata } from '@nw-data/generated'
import { SelectFilter } from '~/ui/data/ag-grid'
import { TableGridUtils } from '~/ui/data/table-grid'

export type NpcTableUtils = TableGridUtils<NpcTableRecord>
export type NpcTableRecord = Npc

export function npcColIcon(util: NpcTableUtils) {
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
            href: util.tipLink('npc', data.NPCId),
            target: '_blank',
          },
        },
        util.elItemIcon({
          class: ['transition-all translate-x-0 hover:translate-x-1'],
          icon: NW_FALLBACK_ICON,
        }),
      )
    }),
  })
}

export function npcColId(util: NpcTableUtils) {
  return util.colDef<string>({
    colId: 'nPCId',
    headerValueGetter: () => 'ID',
    field: 'NPCId',
    //hide: true,
  })
}

export function npcColName(util: NpcTableUtils) {
  return util.colDef<string>({
    colId: 'name',
    headerValueGetter: () => 'Name',
    field: 'Name',
    valueGetter: ({ data }) => util.tl8(data.Name),
  })
}
