import { ICellRendererParams } from '@ag-grid-community/core'
import {
  VitalFamilyInfo,
  getVitalCategoryInfo,
  getVitalDamageEffectivenessPercent,
  getVitalTypeMarker,
  getZoneIcon,
  getZoneName,
  isVitalCombatCategory,
  isZoneArea,
  isZonePoi,
  isZoneTerritory,
} from '@nw-data/common'
import {
  GameModeData,
  TerritoryDefinition,
  VitalsBaseData,
  VitalsCategory,
  VitalsCategoryData,
  VitalsLevelVariantData,
} from '@nw-data/generated'
import { ScannedVital } from '@nw-data/generated'

import { uniqBy } from 'lodash'
import { RangeFilter } from '~/ui/data/ag-grid'
import { TableGridUtils } from '~/ui/data/table-grid'
import { assetUrl, humanize, stringToColor } from '~/utils'
import { VitalBuff } from '../vital-detail/vital-detail-buffs.component'

export type VitalTableUtils = TableGridUtils<VitalTableRecord>
export type VitalTableRecord = VitalsBaseData &
  VitalsLevelVariantData & {
    $dungeons: GameModeData[]
    $categories: VitalsCategoryData[]
    $familyInfo: VitalFamilyInfo
    $combatInfo: VitalFamilyInfo[] | null
    $metadata: ScannedVital
    $zones: TerritoryDefinition[]
    $buffs: VitalBuff[]
  }

const cellRendererDamage = ({ value }: ICellRendererParams<VitalTableRecord>) => {
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
export function vitalColIcon(util: VitalTableUtils, options?: { color: boolean }) {
  return util.colDef({
    colId: 'icon',
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Icon',
    resizable: false,
    sortable: false,
    filter: false,
    pinned: true,
    width: 62,
    cellStyle: ({ data }) => {
      const color = options?.color ? stringToColor(data.VitalsID) : ''
      if (!color) {
        return null
      }
      return {
        'border-left': `4px solid ${color}`,
      }
    },
    cellRenderer: util.cellRenderer(({ data }) => {
      return util.elA(
        {
          attrs: { target: '_blank', href: util.tipLink('vitals', String(data.VitalsID)) },
        },
        util.elPicture(
          {
            class: ['transition-all', 'translate-x-0', 'hover:translate-x-1'],
          },
          util.elImg({
            src: getVitalCategoryInfo(data)?.[0]?.Icon,
          }),
        ),
      )
    }),
  })
}
export function vitalColName(util: VitalTableUtils, options?: { link: boolean }) {
  return util.colDef<string[]>({
    colId: 'name',
    headerValueGetter: () => 'Name',
    width: 200,
    valueGetter: ({ data }) => {
      const names = [util.i18n.get(data.DisplayName)]
      for (const cat of data.$categories || []) {
        if (!cat.GroupVitalsCategoryId && cat.VitalsCategoryID !== 'Named') {
          names.push(util.i18n.get(cat.DisplayName))
        }
      }
      return uniqBy(names, (it) => it.toLowerCase())
    },
    cellRenderer: util.cellRenderer(({ data, value }) => {
      let content: string
      const [name, ...alias] = value as string[]
      if (!alias.length) {
        content = name
      } else {
        content = `
          <span>${name}</span><br>
          <span class="italic">${alias.join(', ')}</span>
        `
      }
      if (!options?.link) {
        return content
      }
      return util.elA({
        attrs: { target: '_blank', href: `/vitals/${data.VitalsID.toLowerCase()}` },
        class: ['link-hover'],
        html: content,
      })
    }),
    getQuickFilterText: ({ value }) => value.join(' '),
  })
}
export function vitalColLevel(util: VitalTableUtils) {
  return util.colDef<number>({
    colId: 'level',
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Level',
    getQuickFilterText: () => '',
    width: 150,
    minWidth: 150,
    maxWidth: 150,
    resizable: false,
    field: 'Level',
    cellClass: '',
    cellRenderer: util.cellRenderer(({ data, value }) => {
      const icon = assetUrl(getVitalTypeMarker(data))
      const iconEl = icon && `<img src=${icon} class="block object-cover absolute left-0 top-0 h-full w-full" />`
      const spanEl = `<span class="absolute left-0 right-0 top-0 bottom-0 font-bold flex items-center justify-center">${value}</span>`
      return `${iconEl} ${spanEl}`
    }),
  })
}
export function vitalColFamily(util: VitalTableUtils) {
  return util.colDef<string[]>({
    colId: 'family',
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Family',
    valueGetter: ({ data: { $familyInfo } }) => {
      return [$familyInfo.ID]
    },
    valueFormatter: ({ data: { $familyInfo, Family } }) => {
      return util.i18n.get($familyInfo.Name) || Family || ''
    },
    hide: true,
    width: 125,
    getQuickFilterText: ({ value }) => value?.join(' '),
    ...util.selectFilter({
      order: 'asc',
    }),
  })
}
export function vitalColCreatureType(util: VitalTableUtils) {
  return util.colDef({
    colId: 'creatureType',
    width: 150,
    hide: true,
    headerValueGetter: () => 'Creature Type',
    valueGetter: util.fieldGetter('CreatureType'),
    valueFormatter: ({ value }) => humanize(value),
    getQuickFilterText: ({ value }) => value,
    ...util.selectFilter({
      order: 'asc',
    }),
  })
}
export function vitalColCategories(util: VitalTableUtils) {
  return util.colDef<VitalsCategoryData[]>({
    colId: 'categories',
    headerValueGetter: () => 'Categories',
    width: 250,
    valueGetter: ({ data }) => {
      return data.$categories || null
    },
    cellRenderer: util.tagsRenderer({
      transform: (it: VitalsCategoryData) => util.i18n.get(it.DisplayName) || it.VitalsCategoryID,
      getClass: (value: VitalsCategoryData) => {
        if (!value) {
          return []
        }
        if (isVitalCombatCategory(value.VitalsCategoryID)) {
          return ['badge-error', 'bg-error']
        }
        if (value.IsNamed) {
          return ['badge-primary', 'bg-primary']
        }
        return []
      },
    }),
    ...util.selectFilter({
      order: 'asc',
      search: true,
      getOptions: ({ data }) => {
        return (data.$categories || []).map((it) => {
          return {
            id: it.VitalsCategoryID,
            label: util.i18n.get(it.DisplayName) || it.VitalsCategoryID,
          }
        })
      },
    }),
  })
}
export function vitalColLootDropChance(util: VitalTableUtils) {
  return util.colDef<number>({
    colId: 'lootDropChance',
    headerValueGetter: () => 'Loot Drop Chance',
    cellClass: 'text-right',
    width: 150,
    hide: true,
    filter: RangeFilter,
    valueGetter: ({ data }) => Math.round((Number(data.LootDropChance) || 0) * 100),
    valueFormatter: ({ value }) => `${value}%`,
    getQuickFilterText: () => '',
  })
}
export function vitalColLootTableId(util: VitalTableUtils) {
  return util.colDef({
    colId: 'lootTableId',
    hide: true,
    headerValueGetter: () => 'Loot Table',
    valueGetter: util.fieldGetter('LootTableId'),
    ...util.selectFilter({
      order: 'asc',
    }),
  })
}
export function vitalColLootTags(util: VitalTableUtils) {
  return util.colDef({
    colId: 'lootTags',
    hide: true,
    headerValueGetter: () => 'Loot Tags',
    valueGetter: util.fieldGetter('LootTags'),
    cellRenderer: util.tagsRenderer({
      transform: humanize,
      getClass: (value) => {
        return isVitalCombatCategory(value) ? ['badge-error', 'bg-error'] : []
      },
    }),
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}
export function vitalColExpedition(util: VitalTableUtils) {
  return util.colDef<string[]>({
    colId: 'expedition',
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Occurance in',
    valueGetter: ({ data }) => data?.$dungeons?.map((it) => util.i18n.get(it.DisplayName)),
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}
export function vitalColDmgEffectivenessSlash(util: VitalTableUtils) {
  return util.colDef<number>({
    colId: 'dmgEffectivenessSlash',
    headerValueGetter: () => 'Slash',
    filter: false,
    width: 80,
    minWidth: 80,
    maxWidth: 80,
    resizable: false,
    valueGetter: ({ data }) => getVitalDamageEffectivenessPercent(data, 'Slash'),
    cellRenderer: cellRendererDamage,
    getQuickFilterText: () => '',
  })
}
export function vitalColDmgEffectivenessThrust(util: VitalTableUtils) {
  return util.colDef<number>({
    colId: 'dmgEffectivenessThrust',
    headerValueGetter: () => 'Thrust',
    filter: false,
    width: 80,
    minWidth: 80,
    maxWidth: 80,
    resizable: false,
    valueGetter: ({ data }) => getVitalDamageEffectivenessPercent(data, 'Thrust'),
    cellRenderer: cellRendererDamage,
    getQuickFilterText: () => '',
  })
}
export function vitalColDmgEffectivenessStrike(util: VitalTableUtils) {
  return util.colDef<number>({
    colId: 'dmgEffectivenessStrike',
    headerValueGetter: () => 'Strike',
    filter: false,
    width: 80,
    minWidth: 80,
    maxWidth: 80,
    resizable: false,
    valueGetter: ({ data }) => getVitalDamageEffectivenessPercent(data, 'Strike'),
    cellRenderer: cellRendererDamage,
    getQuickFilterText: () => '',
  })
}
export function vitalColDmgEffectivenessFire(util: VitalTableUtils) {
  return util.colDef<number>({
    colId: 'dmgEffectivenessFire',
    headerValueGetter: () => 'Fire',
    filter: false,
    width: 80,
    minWidth: 80,
    maxWidth: 80,
    resizable: false,
    valueGetter: ({ data }) => getVitalDamageEffectivenessPercent(data, 'Fire'),
    cellRenderer: cellRendererDamage,
    getQuickFilterText: () => '',
  })
}
export function vitalColDmgEffectivenessIce(util: VitalTableUtils) {
  return util.colDef<number>({
    colId: 'dmgEffectivenessIce',
    headerValueGetter: () => 'Ice',
    filter: false,
    width: 80,
    minWidth: 80,
    maxWidth: 80,
    resizable: false,
    valueGetter: ({ data }) => getVitalDamageEffectivenessPercent(data, 'Ice'),
    cellRenderer: cellRendererDamage,
    getQuickFilterText: () => '',
  })
}
export function vitalColDmgEffectivenessNature(util: VitalTableUtils) {
  return util.colDef<number>({
    colId: 'dmgEffectivenessNature',
    headerValueGetter: () => 'Nature',
    filter: false,
    width: 80,
    minWidth: 80,
    maxWidth: 80,
    resizable: false,
    valueGetter: ({ data }) => getVitalDamageEffectivenessPercent(data, 'Nature'),
    cellRenderer: cellRendererDamage,
    getQuickFilterText: () => '',
  })
}
export function vitalColDmgEffectivenessVoid(util: VitalTableUtils) {
  return util.colDef<number>({
    colId: 'dmgEffectivenessVoid',
    headerValueGetter: () => 'Void',
    filter: false,
    width: 80,
    minWidth: 80,
    maxWidth: 80,
    resizable: false,
    valueGetter: ({ data }) => getVitalDamageEffectivenessPercent(data, 'Corruption'),
    cellRenderer: cellRendererDamage,
    getQuickFilterText: () => '',
  })
}
export function vitalColDmgEffectivenessLighting(util: VitalTableUtils) {
  return util.colDef<number>({
    colId: 'dmgEffectivenessLighting',
    headerValueGetter: () => 'Lighting',
    filter: false,
    width: 80,
    minWidth: 80,
    maxWidth: 80,
    resizable: false,
    valueGetter: ({ data }) => getVitalDamageEffectivenessPercent(data, 'Lightning'),
    cellRenderer: cellRendererDamage,
    getQuickFilterText: () => '',
  })
}
export function vitalColDmgEffectivenessArcane(util: VitalTableUtils) {
  return util.colDef<number>({
    colId: 'dmgEffectivenessArcane',
    headerValueGetter: () => 'Arcane',
    filter: false,
    width: 80,
    minWidth: 80,
    maxWidth: 80,
    resizable: false,
    valueGetter: ({ data }) => getVitalDamageEffectivenessPercent(data, 'Arcane'),
    cellRenderer: cellRendererDamage,
    getQuickFilterText: () => '',
  })
}

export function vitalColSpawnCount(util: VitalTableUtils) {
  return util.colDef<number>({
    colId: 'spawnCount',
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Spawn Count',
    getQuickFilterText: () => '',
    filter: 'agNumberColumnFilter',
    valueGetter: ({ data }) => {
      let count = 0
      if (data.$metadata?.spawns) {
        for (const key in data.$metadata.spawns) {
          count += data.$metadata.spawns[key]?.length || 0
        }
      }
      return count
    },
  })
}

export function vitalColSpawnLevels(util: VitalTableUtils) {
  return util.colDef<number[]>({
    colId: 'spawnLevels',
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Spawn Levels',
    getQuickFilterText: () => '',
    valueGetter: ({ data }) => {
      return data?.$metadata?.levels
    },
    width: 150,
    wrapText: true,
    ...util.selectFilter({
      order: 'asc',
      getOptions: ({ data }) => {
        const levels: number[] = data?.$metadata?.levels
        if (!levels?.length) {
          return []
        }
        return levels.map((it) => {
          return {
            id: it as any,
            label: `Level ${String(it).padStart(2, '0')}`,
          }
        })
      },
    }),
  })
}

export function vitalColSpawnTerritories(util: VitalTableUtils) {
  const zoneFilter = isZoneTerritory
  return util.colDef<number[]>({
    colId: 'spawnTerritories',
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Spawn Territories',
    getQuickFilterText: () => '',
    valueGetter: ({ data }) => data.$zones?.filter(zoneFilter).map((it) => it.TerritoryID),
    valueFormatter: ({ data }) => {
      const items = data.$zones?.filter(zoneFilter) || []
      return items.map((it) => util.tl8(getZoneName(it))).join(', ')
    },
    ...util.selectFilter({
      order: 'asc',
      search: true,
      getOptions: ({ data }) => {
        const items = data.$zones?.filter(zoneFilter) || []
        return items.map((it) => {
          return {
            id: it.TerritoryID as any,
            label: util.tl8(getZoneName(it)),
            icon: getZoneIcon(it),
          }
        })
      },
    }),
  })
}

export function vitalColSpawnAreas(util: VitalTableUtils) {
  const zoneFilter = isZoneArea
  return util.colDef<number[]>({
    colId: 'spawnAreas',
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Spawn Areas',
    getQuickFilterText: () => '',
    valueGetter: ({ data }) => data.$zones?.filter(zoneFilter).map((it) => it.TerritoryID),
    valueFormatter: ({ data }) => {
      const items = data.$zones?.filter(zoneFilter) || []
      return items.map((it) => util.tl8(getZoneName(it))).join(', ')
    },
    ...util.selectFilter({
      order: 'asc',
      search: true,
      getOptions: ({ data }) => {
        const items = data.$zones?.filter(zoneFilter) || []
        return items.map((it) => {
          return {
            id: it.TerritoryID as any,
            label: util.tl8(getZoneName(it)),
            icon: getZoneIcon(it),
          }
        })
      },
    }),
  })
}

export function vitalColSpawnPois(util: VitalTableUtils) {
  const zoneFilter = isZonePoi
  return util.colDef<number[]>({
    colId: 'spawnPois',
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Spawn POIs',
    getQuickFilterText: () => '',
    valueGetter: ({ data }) => data.$zones?.filter(zoneFilter).map((it) => it.TerritoryID),
    valueFormatter: ({ data }) => {
      const items = data.$zones?.filter(zoneFilter) || []
      return items.map((it) => util.tl8(getZoneName(it))).join(', ')
    },
    ...util.selectFilter({
      order: 'asc',
      search: true,
      getOptions: ({ data }) => {
        const items = data.$zones?.filter(zoneFilter) || []
        return items.map((it) => {
          return {
            id: it.TerritoryID as any,
            label: util.tl8(getZoneName(it)),
            icon: getZoneIcon(it),
          }
        })
      },
    }),
  })
}

export function vitalColBuffs(util: VitalTableUtils) {
  return util.colDef<string[]>({
    colId: 'buffs',
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Buffs',
    getQuickFilterText: () => '',
    valueGetter: ({ data }) =>
      data.$buffs
        .map((it) => {
          if (it.ability) {
            return it.ability.AbilityID
          }
          if (it.effect) {
            return it.effect.StatusID
          }
          return null
        })
        .filter((it) => !!it),
    hide: true,
    cellRenderer: util.cellRenderer(({ data }) => {
      return util.el(
        'div.line-clamp-3.text-wrap.leading-tight',
        {},
        data.$buffs
          .map((it) => {
            if (it.ability) {
              return util.elA({
                attrs: {
                  target: '_blank',
                  href: util.nwLink.resourceLink({ type: 'ability', id: it.ability.AbilityID }),
                },
                class: ['text-primary', 'link', 'text-xs', 'leading-tight', 'mr-2'],
                html: util.tl8(it.ability.DisplayName || it.ability.AbilityID),
              })
            }
            if (it.effect) {
              return util.elA({
                attrs: {
                  target: '_blank',
                  href: util.nwLink.resourceLink({ type: 'status-effect', id: it.effect.StatusID }),
                },
                class: ['text-primary', 'link', 'text-xs', 'leading-tight', 'mr-2'],
                html: util.tl8(it.effect.DisplayName || it.effect.StatusID),
              })
            }
            return null
          })
          .filter((it) => !!it),
      )
    }),
    ...util.selectFilter({
      order: 'asc',
      search: true,
      getOptions: ({ data }) => {
        const items = data.$buffs
          .map((it) => {
            if (it.ability) {
              return {
                id: it.ability.AbilityID,
                name: it.ability.DisplayName || it.ability.AbilityID,
              }
            }
            if (it.effect) {
              return {
                id: it.effect.StatusID,
                name: it.effect.DisplayName || it.effect.StatusID,
              }
            }
            return null
          })
          .filter((it) => !!it)
        return items.map((it) => {
          return {
            id: it.id,
            label: util.tl8(it.name),
          }
        })
      },
    }),
  })
}
