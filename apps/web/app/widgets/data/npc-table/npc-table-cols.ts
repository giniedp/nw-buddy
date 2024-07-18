import { NW_FALLBACK_ICON } from '@nw-data/common'
import { TableGridUtils } from '~/ui/data/table-grid'
import { NpcGroup } from '../npc-detail'

export type NpcTableUtils = TableGridUtils<NpcTableRecord>
export type NpcTableRecord = NpcGroup

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
            href: util.tipLink('npc', data.npcs[0].id),
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
    field: 'id',
    //hide: true,
  })
}

export function npcColName(util: NpcTableUtils) {
  return util.colDef<string>({
    colId: 'genericName',
    headerValueGetter: () => 'Name',
    valueGetter: ({ data }) => util.tl8(data.name),
  })
}

export function npcColTitle(util: NpcTableUtils) {
  return util.colDef<string>({
    colId: 'title',
    headerValueGetter: () => 'Title',
    valueGetter: ({ data }) => util.tl8(data.title),
  })
}
