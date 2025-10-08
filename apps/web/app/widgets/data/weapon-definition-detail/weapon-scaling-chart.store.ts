import { computed } from '@angular/core'
import { patchState, signalMethod, signalStore, withComputed, withMethods, withProps, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { AttributeRef, getDamageForTooltip, getDamageScalingForWeapon, NW_MAX_CHARACTER_LEVEL } from '@nw-data/common'
import { AffixStatData, AttributeDefinition, WeaponItemDefinitions } from '@nw-data/generated'
import { ChartConfiguration } from 'chart.js'
import { map, pipe, switchMap } from 'rxjs'
import tc from 'tinycolor2'
import { injectNwData } from '~/data'
import { eqCaseInsensitive, resourceValue } from '~/utils'

export interface WeaponScalingChartState {
  playerLevel: number
  weaponId: string
  affixId: string
  gearScore: number
  stats: Record<AttributeRef, number>
}
const DEFAULT_STATE: WeaponScalingChartState = {
  playerLevel: NW_MAX_CHARACTER_LEVEL,
  weaponId: null,
  affixId: null,
  gearScore: null,
  stats: {
    str: 0,
    dex: 0,
    int: 0,
    foc: 0,
    con: 0,
  },
}
const COLORS = ['#003f5c', '#2f4b7c', '#665191', '#a05195', '#d45087', '#f95d6a', '#ff7c43', '#ffa600'].reverse()
const STAT_COLORS: Record<AttributeRef, string> = {
  dex: COLORS[0],
  str: COLORS[1],
  int: COLORS[2],
  foc: COLORS[3],
  con: COLORS[4],
}

export const WeaponScalingChartStore = signalStore(
  withState<WeaponScalingChartState>(DEFAULT_STATE),
  withMethods((state) => {
    const db = injectNwData()
    return {
      loadByItemId: rxMethod(
        pipe(
          switchMap(async (itemId: string) => {
            const item = await db.itemsById(itemId)
            const weaponId = item.ItemStatsRef
            patchState(state, { weaponId })
          }),
        ),
      ),
      loadByWeaponTag: rxMethod(
        pipe(
          switchMap(async (weaponTag: string) => {
            const items = await db.weaponItemsAll()
            const item = items.find((it) => {
              if (!it.WeaponID.endsWith('T5')) {
                return false
              }
              if (!it.MannequinTag) {
                return false
              }
              return it.MannequinTag.some((it) => eqCaseInsensitive(it, weaponTag))
            })
            const weaponId = item.WeaponID
            patchState(state, { weaponId })
          }),
        ),
      ),
      loadByWeaponId: rxMethod(
        pipe(
          map((weaponId: string) => {
            patchState(state, { weaponId })
          }),
        ),
      ),
      connectAffixId: signalMethod((affixId: string) => patchState(state, { affixId })),
      connectLevel: signalMethod((playerLevel: number) => patchState(state, { playerLevel })),
      connectGearScore: signalMethod((gearScore: number) => patchState(state, { gearScore })),
      connectStats: signalMethod((stats: Record<AttributeRef, number>) => patchState(state, { stats })),
    }
  }),
  withProps(({ affixId, weaponId }) => {
    const db = injectNwData()
    const affix = resourceValue({
      keepPrevious: true,
      defaultValue: null,
      params: affixId,
      loader: ({ params }) => db.affixStatsById(params),
    })
    const weapon = resourceValue({
      keepPrevious: true,
      defaultValue: null,
      params: weaponId,
      loader: ({ params }) => db.weaponItemsById(params),
    })
    const tables = resourceValue({
      keepPrevious: true,
      defaultValue: {
        dex: [],
        str: [],
        int: [],
        foc: [],
        con: [],
      },
      loader: async (): Promise<Record<AttributeRef, ModifierTable>> => {
        return {
          dex: await db.attrDex(),
          str: await db.attrStr(),
          int: await db.attrInt(),
          foc: await db.attrFoc(),
          con: await db.attrCon(),
        }
      },
    })

    return {
      affix,
      weapon,
      tables,
    }
  }),
  withComputed(({ tables, gearScore, playerLevel, weapon, affix, stats }) => {
    return {
      damageStats: computed(() => {
        return selectWeaponDamage({
          tables: tables(),
          gearScore: gearScore(),
          playerLevel: playerLevel(),
          weapon: weapon(),
          affix: affix(),
          stats: stats(),
        })
      }),
    }
  }),
  withComputed(({ tables, damageStats, stats }) => {
    return {
      chartConfig: computed(() => {
        return selectChartConfig({
          levels: tables().dex.map((it) => it.Level),
          tables: tables(),
          damageStats: damageStats(),
          stats: stats(),
        })
      }),
    }
  }),
)

export interface WeaponDamageStats {
  invalidValue?: number
  value: number
  scale: Record<AttributeRef, number>
}

export type ModifierTable = Array<Pick<AttributeDefinition, 'ModifierValue' | 'ModifierValueSum' | 'Level'>>

function selectWeaponDamage({
  tables,
  stats,
  weapon,
  affix,
  gearScore,
  playerLevel,
}: {
  tables: Record<AttributeRef, ModifierTable>
  stats: Record<AttributeRef, number>
  weapon: WeaponItemDefinitions
  affix: AffixStatData
  gearScore: number
  playerLevel: number
}): WeaponDamageStats {
  if (!weapon) {
    return {
      value: 0,
      scale: {
        dex: 0,
        str: 0,
        int: 0,
        foc: 0,
        con: 0,
      },
    }
  }

  const attrSums: Record<AttributeRef, number> = {
    str: selectModifierValue(tables.str, stats.str),
    dex: selectModifierValue(tables.dex, stats.dex),
    int: selectModifierValue(tables.int, stats.int),
    foc: selectModifierValue(tables.foc, stats.foc),
    con: selectModifierValue(tables.con, stats.con),
  }
  const affixScale = getDamageScalingForWeapon(affix)
  const weaponScale = getDamageScalingForWeapon(weapon)
  const affixPercent = affix?.DamagePercentage || 0
  const weaponPercent = 1 - affixPercent
  const affixDamage = getDamageForTooltip({
    attrSums,
    playerLevel,
    gearScore,
    weapon,
    weaponScale: affixScale,
    damageCoef: 1, // skips the dmg coef for tooltip adjustments
  })
  const weaponDamage = getDamageForTooltip({
    attrSums,
    playerLevel,
    gearScore,
    weapon,
    weaponScale: weaponScale,
    damageCoef: 1, // skips the dmg coef for tooltip adjustments
  })

  if (affix?.PreferHigherScaling && affixDamage > weaponDamage) {
    return {
      invalidValue: weaponDamage * weaponPercent + affixDamage * affixPercent,
      value: affixDamage,
      scale: affixScale,
    }
  }

  return {
    value: weaponDamage,
    scale: weaponScale,
  }
}

function selectChartConfig({
  levels,
  tables,
  damageStats,
  stats,
}: {
  levels: number[]
  tables: Record<AttributeRef, ModifierTable>
  damageStats: WeaponDamageStats
  stats: Record<AttributeRef, number>
}): ChartConfiguration {
  const scale = damageStats.scale
  const keys: AttributeRef[] = Object.keys(tables).filter((key) => !!scale[key]) as AttributeRef[]

  return {
    type: 'line',
    options: {
      animation: false,
      responsive: true,
      aspectRatio: 16 / 9,
      maintainAspectRatio: false,
      elements: {
        point: {
          hoverRadius: (context) => {
            return stats[context.dataset['key']] === levels[context.dataIndex] ? 10 : 5
          },
          radius: (context) => {
            return stats[context.dataset['key']] === levels[context.dataIndex] ? 8 : 1
          },
        },
      },
      scales: {
        x: {
          ticks: {
            callback: (value) => {
              value = Number(value)
              const snapped = Math.floor(value / 25) * 25
              if (value == snapped) {
                return value
              }
              return undefined
            },
          },
        },
        y: {
          position: 'left',
        },
        y1: {
          position: 'right',
        },
      },
      hover: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false,
        },
      },
    },
    data: {
      labels: levels,
      datasets: [
        ...keys.map((key, i) => {
          const table = tables[key]
          return {
            key: key,
            label: `${key.toUpperCase()} sum`,
            data: levels.map((_, index) => {
              index = Math.min(Math.max(index, 0), table.length - 1)
              return table[index]?.ModifierValueSum * scale[key] || 0
            }),
            backgroundColor: STAT_COLORS[key],
            yAxisID: 'y1',
          }
        }),
        ...keys.map((key, i) => {
          const table = tables[key]
          return {
            key: key,
            label: `${key.toUpperCase()} step`,
            data: levels.map((_, index) => {
              index = Math.min(Math.max(index, 0), table.length - 1)
              return table[index]?.ModifierValue * scale[key] || 0
            }),
            backgroundColor: tc(STAT_COLORS[key]).darken(10).toHexString(),
            yAxisID: 'y',
          }
        }),
      ],
    },
  }
}

function selectModifierValue(table: ModifierTable, level: number) {
  if (!table?.length) {
    return 0
  }
  const index = Math.min(Math.max(level - table[0].Level, 0), table.length - 1)
  return table[index]?.ModifierValueSum || 0
}
