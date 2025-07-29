import { NW_FALLBACK_ICON } from '@nw-data/common'
import { COLS_STATUSEFFECTDATA, SpellData, StatusEffectData } from '@nw-data/generated'
import { ExpressionFilter } from '~/ui/data/ag-grid/expression-filter'
import { TableGridUtils, colDefPrecision } from '~/ui/data/table-grid'
import { humanize } from '~/utils'

export type SpellTableUtils = TableGridUtils<SpellTableRecord>
export type SpellTableRecord = SpellData

export function spellColIcon(util: SpellTableUtils) {
  return util.colDef({
    colId: 'icon',
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Icon',
    resizable: false,
    sortable: false,
    filter: ExpressionFilter,
    filterParams: ExpressionFilter.params({
      fields: Object.keys(COLS_STATUSEFFECTDATA),
    }),
    pinned: true,
    width: 62,
    cellClass: ['overflow-visible'],
    cellRenderer: util.cellRenderer(({ data }) => {
      return util.elPicture(
        {
          class: ['transition-all', 'translate-x-0', 'hover:translate-x-1', 'nw-status-bg'],
        },
        util.elImg({
          src: NW_FALLBACK_ICON,
        }),
      )
    }),
  })
}
export function spellColSpellID(util: SpellTableUtils) {
  return util.colDef<string>({
    colId: 'spellID',
    hide: false,
    headerValueGetter: () => 'Spell ID',
    field: 'SpellID',
  })
}

export function spellColSource(util: SpellTableUtils) {
  return util.colDef<string>({
    colId: 'source',
    hide: false,
    headerValueGetter: () => 'Source',
    valueGetter: ({ data }) => data['$source'],
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}

export function spellColAbilityID(util: SpellTableUtils) {
  return util.colDef<string>({
    colId: 'abilityID',
    hide: false,
    headerValueGetter: () => 'Ability ID',
    field: 'AbilityId',
  })
}

export function spellColBaseDamage(util: SpellTableUtils) {
  return util.colDef<number>({
    colId: 'baseDamage',
    hide: false,
    headerValueGetter: () => 'Base Damage',
    field: 'BaseDamage',
  })
}

export function spellColDamageTable(util: SpellTableUtils) {
  return util.colDef<string>({
    colId: 'damageTable',
    hide: false,
    headerValueGetter: () => 'Damage Table',
    field: 'DamageTable',
  })
}

export function spellColDamageTableRow(util: SpellTableUtils) {
  return util.colDef<string>({
    colId: 'damageTableRow',
    hide: false,
    headerValueGetter: () => 'Damage Table Row',
    field: 'DamageTableRow',
  })
}

export function spellColDamageType(util: SpellTableUtils) {
  return util.colDef<string>({
    colId: 'damageType',
    hide: false,
    headerValueGetter: () => 'Damage Type',
    field: 'DamageType',
  })
}

export function spellColDuration(util: SpellTableUtils) {
  return util.colDef<number>({
    colId: 'duration',
    hide: false,
    headerValueGetter: () => 'Duration',
    field: 'Duration',
  })
}

export function spellColSpellTypes(util: SpellTableUtils) {
  return util.colDef<string>({
    colId: 'spellTypes',
    hide: false,
    headerValueGetter: () => 'Spell Types',
    field: 'SpellTypes',
  })
}

export function spellColStatusEffects(util: SpellTableUtils) {
  return util.colDef<string[]>({
    colId: 'statusEffects',
    hide: false,
    headerValueGetter: () => 'Status Effects',
    field: 'StatusEffects',
  })
}

export function spellColStatusEffectDuration(util: SpellTableUtils) {
  return util.colDef<number | string>({
    colId: 'statusEffectDuration',
    hide: false,
    headerValueGetter: () => 'Status Effects Duration',
    field: 'StatusEffectDurations',
  })
}
export function spellColUseStatusEffectDuration(util: SpellTableUtils) {
  return util.colDef<boolean>({
    colId: 'useStatusEffectDuration',
    hide: false,
    headerValueGetter: () => 'Use Status Effect Duration',
    field: 'UseStatusEffectDuration',
  })
}
