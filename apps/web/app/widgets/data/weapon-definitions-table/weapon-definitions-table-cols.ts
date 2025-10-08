import { NW_FALLBACK_ICON } from '@nw-data/common'
import { MannequinTag, WeaponItemDefinitions } from '@nw-data/generated'
import { TableGridUtils } from '~/ui/data/table-grid'
import { getWeaponTypeByProgressionId } from '../../../nw/weapon-types'

export type WeaponDefinitionTableUtils = TableGridUtils<WeaponDefinitionTableRecord>
export type WeaponDefinitionTableRecord = WeaponItemDefinitions

export function weaponDefColIcon(util: WeaponDefinitionTableUtils) {
  return util.colDef({
    colId: 'icon',
    headerValueGetter: () => 'Icon',
    resizable: false,
    sortable: false,
    filter: false,
    pinned: true,
    width: 62,
    cellClass: ['overflow-visible'],
    cellRenderer: util.cellRenderer(({ data }) => {
      return util.elItemIcon({
        class: ['transition-all translate-x-0 hover:translate-x-1'],
        icon: getWeaponTypeByProgressionId(data.WeaponMasteryCategoryId)?.IconPathSmall || NW_FALLBACK_ICON,
      })
    }),
  })
}
export function weaponDefColID(util: WeaponDefinitionTableUtils) {
  return util.colDef<string>({
    colId: 'weaponID',
    headerValueGetter: () => 'ID',
    field: 'WeaponID',
    getQuickFilterText: ({ value }) => value,
  })
}

export function weaponDefColEffectID(util: WeaponDefinitionTableUtils) {
  return util.colDef<string>({
    colId: 'weaponEffectId',
    headerValueGetter: () => 'Effect ID',
    field: 'WeaponEffectId',
    getQuickFilterText: ({ value }) => value,
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}

export function weaponDefColEquipType(util: WeaponDefinitionTableUtils) {
  return util.colDef<string>({
    colId: 'equipType',
    headerValueGetter: () => 'Equip Type',
    field: 'EquipType',
    getQuickFilterText: ({ value }) => value,
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}

export function weaponDefColWeaponMasteryCategoryId(util: WeaponDefinitionTableUtils) {
  return util.colDef<string>({
    colId: 'weaponMasteryCategoryId',
    headerValueGetter: () => 'Weapon Mastery',
    field: 'WeaponMasteryCategoryId',
    getQuickFilterText: ({ value }) => value,
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}
export function weaponDefColPrimaryUse(util: WeaponDefinitionTableUtils) {
  return util.colDef<string>({
    colId: 'primaryUse',
    headerValueGetter: () => 'Primary Use',
    field: 'PrimaryUse',
    getQuickFilterText: ({ value }) => value,
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}
export function weaponDefColMannequinTag(util: WeaponDefinitionTableUtils) {
  return util.colDef<MannequinTag[]>({
    colId: 'mannequinTag',
    headerValueGetter: () => 'Mannequin Tag',
    cellRenderer: util.tagsRenderer(),
    field: 'MannequinTag',
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}
export function weaponDefColTierNumber(util: WeaponDefinitionTableUtils) {
  return util.colDef<number>({
    colId: 'tierNumber',
    headerValueGetter: () => 'Tier',
    field: 'TierNumber',
  })
}

export function weaponDefColBaseDamage(util: WeaponDefinitionTableUtils) {
  return util.colDef<number>({
    colId: 'BaseDamage',
    headerValueGetter: () => 'Base Damage',
    field: 'BaseDamage',
  })
}

export function weaponDefColBaseStaggerDamage(util: WeaponDefinitionTableUtils) {
  return util.colDef<number>({
    colId: 'BaseStaggerDamage',
    headerValueGetter: () => 'Base Stagger Damage',
    field: 'BaseStaggerDamage',
  })
}

export function weaponDefColCritChance(util: WeaponDefinitionTableUtils) {
  return util.colDef<number>({
    colId: 'CritChance',
    headerValueGetter: () => 'Crit Chance',
    field: 'CritChance',
  })
}

export function weaponDefColCritDamageMultiplier(util: WeaponDefinitionTableUtils) {
  return util.colDef<number>({
    colId: 'CritDamageMultiplier',
    headerValueGetter: () => 'Crit Damage Multiplier',
    field: 'CritDamageMultiplier',
  })
}

export function weaponDefColBlockStaminaDamage(util: WeaponDefinitionTableUtils) {
  return util.colDef<number>({
    colId: 'BlockStaminaDamage',
    headerValueGetter: () => 'Block Stamina Damage',
    field: 'BlockStaminaDamage',
  })
}

export function weaponDefColBlockStability(util: WeaponDefinitionTableUtils) {
  return util.colDef<number>({
    colId: 'BlockStability',
    headerValueGetter: () => 'Block Stability',
    field: 'BlockStability',
  })
}
