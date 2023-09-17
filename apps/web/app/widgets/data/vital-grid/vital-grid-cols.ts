import { ICellRendererParams } from '@ag-grid-community/core'
import {
  VitalFamilyInfo,
  getVitalAliasName,
  getVitalCategoryInfo,
  getVitalDamageEffectivenessPercent,
  getVitalTypeMarker,
  isVitalCombatCategory,
} from '@nw-data/common'
import { Gamemodes, Vitals, Vitalscategories, Vitalsmetadata } from '@nw-data/generated'
import { RangeFilter, SelectFilter } from '~/ui/ag-grid'
import { DataGridUtils } from '~/ui/data-grid'
import { assetUrl, humanize } from '~/utils'

export type VitalGridUtils = DataGridUtils<VitalGridRecord>
export type VitalGridRecord = Vitals & {
  $dungeons: Gamemodes[]
  $categories: Vitalscategories[]
  $familyInfo: VitalFamilyInfo
  $combatInfo: VitalFamilyInfo | null
  $metadata: Vitalsmetadata
}

const cellRendererDamage = ({ value }: ICellRendererParams<VitalGridRecord>) => {
  if (!value) {
    return null
  }
  const icon = value < 0 ? 'assets/icons/weakattack.png' : 'assets/icons/strongattack.png'
  const text = `${value > 0 ? '+' : ''}${value}%`
  return `
      <div class="flex flex-row items-center justify-center relative">
        <img class="w-8 h-8 mr-1" src="${assetUrl(icon)}"/>
        <span class="font-bold">${text}</span>
      </div>
      `
}
export function vitalColIcon(util: VitalGridUtils) {
  return util.colDef({
    colId: 'icon',
    headerValueGetter: () => 'Icon',
    resizable: false,
    sortable: false,
    filter: false,
    pinned: true,
    width: 62,
    cellRenderer: util.cellRenderer(({ data }) => {
      return util.elA(
        {
          attrs: { target: '_blank', href: util.nwLink.link('perk', String(data.VitalsID)) },
        },
        util.elPicture(
          {
            class: ['transition-all', 'translate-x-0', 'hover:translate-x-1'],
          },
          util.elImg({
            src: getVitalCategoryInfo(data)?.Icon,
          })
        )
      )
    }),
  })
}
export function vitalColName(util: VitalGridUtils) {
  return util.colDef({
    colId: 'name',
    headerValueGetter: () => 'Name',
    width: 200,
    valueGetter: util.valueGetter(({ data }) => {
      const name = util.i18n.get(data.DisplayName)
      const alias = util.i18n.get(getVitalAliasName(data.$categories))
      if (alias && name !== alias) {
        return [name, alias]
      }
      return [name]
    }),
    cellRenderer: util.cellRenderer(({ value }) => {
      const [name, alias] = value
      if (!alias) {
        return name
      }
      return `
      <span>${alias}</span><br>
      <span class="italic opacity-50">${name}</span>
    `
    }),
    getQuickFilterText: ({ value }) => value.join(' '),
  })
}
export function vitalColLevel(util: VitalGridUtils) {
  return util.colDef({
    colId: 'level',
    headerValueGetter: () => 'Level',
    width: 150,
    minWidth: 150,
    maxWidth: 150,
    resizable: false,
    field: util.fieldName('Level'),
    cellClass: '',
    cellRenderer: util.cellRenderer(({ data, value }) => {
      const icon = assetUrl(getVitalTypeMarker(data))
      const iconEl = icon && `<img src=${icon} class="block object-cover absolute left-0 top-0 h-full w-full" />`
      const spanEl = `<span class="absolute left-0 right-0 top-0 bottom-0 font-bold flex items-center justify-center">${value}</span>`
      return `${iconEl} ${spanEl}`
    }),
  })
}
export function vitalColFamily(util: VitalGridUtils) {
  return util.colDef({
    colId: 'family',
    headerValueGetter: () => 'Family',
    valueGetter: util.valueGetter(({ data: { $familyInfo, Family, $combatInfo } }) => {
      if ($combatInfo) {
        return [$familyInfo.ID, $combatInfo.ID]
      }
      return [$familyInfo.ID]
    }),
    valueFormatter: util.valueFormatter(({ data: { $familyInfo, Family, $combatInfo } }) => {
      return util.i18n.get($familyInfo.Name) || Family || ''
    }),
    cellRenderer: util.cellRenderer(({ data: { $familyInfo, Family, $combatInfo } }) => {
      const familyName = util.i18n.get($familyInfo.Name) || Family || ''
      const combatName = $combatInfo ? util.i18n.get($combatInfo.Name) || '' : ''
      if (familyName && combatName) {
        return `
        <span class="line-through">${familyName}</span><br>
        <span class="italic opacity-75 text-xs text-primary">${combatName}</span>
      `
      }
      if ($combatInfo && !combatName) {
        return `
        <span class="line-through">${familyName}</span><br>
        <span class="italic opacity-75 text-xs text-primary">is not affected by any ward, bane or trophy</span>
      `
      }
      return `<span>${familyName}</span>`
    }),
    width: 125,
    getQuickFilterText: ({ value }) => value,
    filter: SelectFilter,
  })
}
export function vitalColCreatureType(util: VitalGridUtils) {
  return util.colDef({
    colId: 'creatureType',
    width: 150,
    hide: true,
    headerValueGetter: () => 'Creature Type',
    valueGetter: util.fieldGetter('CreatureType'),
    valueFormatter: ({ value }) => humanize(value),
    getQuickFilterText: ({ value }) => value,
    filter: SelectFilter,
  })
}
export function vitalColCategories(util: VitalGridUtils) {
  return util.colDef({
    colId: 'categories',
    headerValueGetter: () => 'Categories',
    width: 200,
    valueGetter: util.valueGetter(({ data }) => {
      return data.VitalsCategories || null
    }),
    cellRenderer: util.tagsRenderer({
      transform: humanize,
      getClass: (value) => {
        return isVitalCombatCategory(value) ? ['badge-error'] : ['badge-secondary']
      },
    }),
    filter: SelectFilter,
    filterParams: SelectFilter.params({
      showSearch: true,
    }),
  })
}
export function vitalColLootDropChance(util: VitalGridUtils) {
  return util.colDef({
    colId: 'lootDropChance',
    headerValueGetter: () => 'Loot Drop Chance',
    cellClass: 'text-right',
    width: 150,
    filter: RangeFilter,
    valueGetter: util.valueGetter(({ data }) => Math.round((Number(data.LootDropChance) || 0) * 100)),
    valueFormatter: ({ value }) => `${value}%`,
  })
}
export function vitalColLootTableId(util: VitalGridUtils) {
  return util.colDef({
    colId: 'lootTableId',
    hide: true,
    headerValueGetter: () => 'Loot Table',
    valueGetter: util.fieldGetter('LootTableId'),
    filter: SelectFilter,
  })
}
export function vitalColLootTags(util: VitalGridUtils) {
  return util.colDef({
    colId: 'lootTags',
    hide: true,
    headerValueGetter: () => 'Loot Tags',
    valueGetter: util.fieldGetter('LootTags'),
    cellRenderer: util.tagsRenderer({
      transform: humanize,
      getClass: (value) => {
        return isVitalCombatCategory(value) ? ['badge-error'] : ['badge-secondary']
      },
    }),
    filter: SelectFilter,
    filterParams: SelectFilter.params({
      showSearch: true,
    }),
  })
}
export function vitalColExpedition(util: VitalGridUtils) {
  return util.colDef({
    colId: 'expedition',
    headerValueGetter: () => 'Occurance in',
    valueGetter: util.valueGetter(({ data }) => data?.$dungeons?.map((it) => util.i18n.get(it.DisplayName))),
    filter: SelectFilter,
  })
}
export function vitalColDmgEffectivenessSlash(util: VitalGridUtils) {
  return util.colDef({
    colId: 'dmgEffectivenessSlash',
    headerValueGetter: () => 'Slash',
    filter: false,
    width: 80,
    minWidth: 80,
    maxWidth: 80,
    resizable: false,
    valueGetter: util.valueGetter(({ data }) => getVitalDamageEffectivenessPercent(data, 'Slash')),
    cellRenderer: cellRendererDamage,
  })
}
export function vitalColDmgEffectivenessThrust(util: VitalGridUtils) {
  return util.colDef({
    colId: 'dmgEffectivenessThrust',
    headerValueGetter: () => 'Thrust',
    filter: false,
    width: 80,
    minWidth: 80,
    maxWidth: 80,
    resizable: false,
    valueGetter: util.valueGetter(({ data }) => getVitalDamageEffectivenessPercent(data, 'Thrust')),
    cellRenderer: cellRendererDamage,
  })
}
export function vitalColDmgEffectivenessStrike(util: VitalGridUtils) {
  return util.colDef({
    colId: 'dmgEffectivenessStrike',
    headerValueGetter: () => 'Strike',
    filter: false,
    width: 80,
    minWidth: 80,
    maxWidth: 80,
    resizable: false,
    valueGetter: util.valueGetter(({ data }) => getVitalDamageEffectivenessPercent(data, 'Strike')),
    cellRenderer: cellRendererDamage,
  })
}
export function vitalColDmgEffectivenessFire(util: VitalGridUtils) {
  return util.colDef({
    colId: 'dmgEffectivenessFire',
    headerValueGetter: () => 'Fire',
    filter: false,
    width: 80,
    minWidth: 80,
    maxWidth: 80,
    resizable: false,
    valueGetter: util.valueGetter(({ data }) => getVitalDamageEffectivenessPercent(data, 'Fire')),
    cellRenderer: cellRendererDamage,
  })
}
export function vitalColDmgEffectivenessIce(util: VitalGridUtils) {
  return util.colDef({
    colId: 'dmgEffectivenessIce',
    headerValueGetter: () => 'Ice',
    filter: false,
    width: 80,
    minWidth: 80,
    maxWidth: 80,
    resizable: false,
    valueGetter: util.valueGetter(({ data }) => getVitalDamageEffectivenessPercent(data, 'Ice')),
    cellRenderer: cellRendererDamage,
  })
}
export function vitalColDmgEffectivenessNature(util: VitalGridUtils) {
  return util.colDef({
    colId: 'dmgEffectivenessNature',
    headerValueGetter: () => 'Nature',
    filter: false,
    width: 80,
    minWidth: 80,
    maxWidth: 80,
    resizable: false,
    valueGetter: util.valueGetter(({ data }) => getVitalDamageEffectivenessPercent(data, 'Nature')),
    cellRenderer: cellRendererDamage,
  })
}
export function vitalColDmgEffectivenessVoid(util: VitalGridUtils) {
  return util.colDef({
    colId: 'dmgEffectivenessVoid',
    headerValueGetter: () => 'Void',
    filter: false,
    width: 80,
    minWidth: 80,
    maxWidth: 80,
    resizable: false,
    valueGetter: util.valueGetter(({ data }) => getVitalDamageEffectivenessPercent(data, 'Corruption')),
    cellRenderer: cellRendererDamage,
  })
}
export function vitalColDmgEffectivenessLighting(util: VitalGridUtils) {
  return util.colDef({
    colId: 'dmgEffectivenessLighting',
    headerValueGetter: () => 'Lighting',
    filter: false,
    width: 80,
    minWidth: 80,
    maxWidth: 80,
    resizable: false,
    valueGetter: util.valueGetter(({ data }) => getVitalDamageEffectivenessPercent(data, 'Lightning')),
    cellRenderer: cellRendererDamage,
  })
}
export function vitalColDmgEffectivenessArcane(util: VitalGridUtils) {
  return util.colDef({
    colId: 'dmgEffectivenessArcane',
    headerValueGetter: () => 'Arcane',
    filter: false,
    width: 80,
    minWidth: 80,
    maxWidth: 80,
    resizable: false,
    valueGetter: util.valueGetter(({ data }) => getVitalDamageEffectivenessPercent(data, 'Arcane')),
    cellRenderer: cellRendererDamage,
  })
}