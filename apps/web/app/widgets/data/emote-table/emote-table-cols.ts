import { NW_FALLBACK_ICON } from '@nw-data/common'
import { EmoteData } from '@nw-data/generated'
import { TableGridUtils } from '~/ui/data/table-grid'

export type EmoteTableUtils = TableGridUtils<EmoteTableRecord>
export type EmoteTableRecord = EmoteData

export function emoteColIcon(util: EmoteTableUtils) {
  return util.colDef({
    colId: 'icon',
    headerValueGetter: () => 'Icon',
    getQuickFilterText: () => '',
    resizable: false,
    sortable: false,
    pinned: true,
    width: 62,
    cellRenderer: util.cellRenderer(({ data }) => {
      return util.elImg({
        class: ['w-8', 'h-8', 'object-cover'],
        src: data.UiImage || NW_FALLBACK_ICON,
      })
    }),
  })
}
export function emoteColID(util: EmoteTableUtils) {
  return util.colDef<string>({
    colId: 'id',
    headerValueGetter: () => 'ID',
    width: 200,
    field: 'UniqueTagID',
    hide: true,
    getQuickFilterText: ({ value }) => value,
  })
}
export function emoteColName(util: EmoteTableUtils) {
  return util.colDef<string>({
    colId: 'displayName',
    headerValueGetter: () => 'Name',
    width: 200,
    valueGetter: ({ data }) => util.tl8(data.DisplayName),
    getQuickFilterText: ({ value }) => value,
  })
}
export function emoteColDescription(util: EmoteTableUtils) {
  return util.colDef<string>({
    colId: 'displayDescription',
    headerValueGetter: () => 'Description',
    width: 400,
    valueGetter: ({ data }) => util.tl8(data.DisplayDescription),
    cellClass: ['text-nw-description', 'italic'],
    getQuickFilterText: ({ value }) => value,
  })
}
export function emoteColIsEnabled(util: EmoteTableUtils) {
  return util.colDef<boolean>({
    colId: 'isEnabled',
    hide: true,
    headerValueGetter: () => 'Enabled',
    valueGetter: ({ data }) => (data.IsEnabled ? true : false),
  })
}
export function emoteColIsEntitlement(util: EmoteTableUtils) {
  return util.colDef<boolean>({
    colId: 'isEntitlement',
    hide: true,
    headerValueGetter: () => 'Entitlement',
    valueGetter: ({ data }) => (data.IsEntitlement ? true : false),
  })
}
export function emoteColIsPremiumEmote(util: EmoteTableUtils) {
  return util.colDef<boolean>({
    colId: 'isPremiumEmote',
    hide: true,
    headerValueGetter: () => 'Premium',
    valueGetter: ({ data }) => (data.IsPremiumEmote ? true : false),
  })
}
export function emoteColHasCooldown(util: EmoteTableUtils) {
  return util.colDef<boolean>({
    colId: 'hasCooldown',
    hide: true,
    headerValueGetter: () => 'Has Cooldown',
    valueGetter: ({ data }) => (data.HasCooldown ? true : false),
  })
}
export function emoteColDisplayGroup(util: EmoteTableUtils) {
  return util.colDef<string>({
    colId: 'displayGroup',
    headerValueGetter: () => 'Display Group',
    field: 'DisplayGroup',
  })
}
export function emoteColSlashCommand(util: EmoteTableUtils) {
  return util.colDef<string>({
    colId: 'slashCommand',
    headerValueGetter: () => 'Command',
    field: 'SlashCommand',
    cellClass: ['font-mono'],
  })
}
