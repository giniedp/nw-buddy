import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { AttributeRef, NW_MAX_CHARACTER_LEVEL, getDamageForTooltip, getDamageScalingForWeapon } from '@nw-data/common'
import { AffixStatData, AttributeDefinition, WeaponItemDefinitions } from '@nw-data/generated'
import { ChartConfiguration } from 'chart.js'
import { combineLatest, map, switchMap } from 'rxjs'
import tc from 'tinycolor2'
import { injectNwData } from '~/data'
import { selectStream } from '~/utils'

export interface AttributesScalingState {
  playerLevel: number
  weaponId: string
  affixId: string
  gearScore: number
  stats: Record<AttributeRef, number>
}
const COLORS = ['#003f5c', '#2f4b7c', '#665191', '#a05195', '#d45087', '#f95d6a', '#ff7c43', '#ffa600'].reverse()
const STAT_COLORS: Record<AttributeRef, string> = {
  dex: COLORS[0],
  str: COLORS[1],
  int: COLORS[2],
  foc: COLORS[3],
  con: COLORS[4],
}

@Injectable()
export class AttributesScalingStore extends ComponentStore<AttributesScalingState> {
  private db = injectNwData()

  protected readonly scalingAffixId$ = this.select(({ affixId }) => affixId)
  protected readonly scalingAffix$ = this.scalingAffixId$.pipe(switchMap((it) => this.db.affixStatsById(it)))
  protected readonly weaponId$ = this.select(({ weaponId }) => weaponId)
  protected readonly weapon$ = this.weaponId$.pipe(switchMap((it) => this.db.weaponItemsById(it)))

  protected readonly playerLevel$ = this.select(({ playerLevel }) => playerLevel)
  protected readonly gearScore$ = this.select(({ gearScore }) => gearScore)
  protected readonly stats$ = this.select(({ stats }) => stats)
  protected readonly tables$ = selectStream(
    combineLatest({
      dex: this.db.attrDex(),
      str: this.db.attrStr(),
      int: this.db.attrInt(),
      foc: this.db.attrFoc(),
      con: this.db.attrCon(),
    }),
  )

  public readonly damageStats$ = selectStream(
    {
      tables: this.tables$,
      gearScore: this.gearScore$,
      playerLevel: this.playerLevel$,
      weapon: this.weapon$,
      affix: this.scalingAffix$,
      stats: this.stats$,
    },
    (data) =>
      selectWeaponDamage({
        tables: data.tables,
        gearScore: data.gearScore,
        playerLevel: data.playerLevel,
        weapon: data.weapon,
        affix: data.affix,
        stats: data.stats,
      }),
    {
      debounce: true,
    },
  )

  public chartConfig$ = selectStream(
    {
      levels: this.tables$.pipe(map((it) => it.dex.map((it) => it.Level))),
      tables: this.tables$,
      damageStats: this.damageStats$,
      stats: this.stats$,
    },
    (data) =>
      selectChartConfig({
        levels: data.levels,
        tables: data.tables,
        damageStats: data.damageStats,
        stats: data.stats,
      }),
    {
      debounce: true,
    },
  )

  public constructor() {
    super({
      playerLevel: NW_MAX_CHARACTER_LEVEL,
      weaponId: null,
      affixId: null,
      gearScore: null,
      stats: {
        con: 0,
        dex: 0,
        foc: 0,
        int: 0,
        str: 0,
      },
    })
  }
}

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
  // console.log('weapon')
  // console.table({
  //   ...weaponScale,
  //   weaponPercent,
  //   weaponDamage,
  // })
  // console.log('affix')
  // console.table({
  //   ...affixScale,
  //   affixPercent,
  //   affixDamage,
  // })

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
  tables: Record<AttributeRef, Array<Pick<AttributeDefinition, 'ModifierValue' | 'ModifierValueSum'>>>
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
          }
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
  const index = Math.min(Math.max(level - table[0].Level, 0), table.length - 1)
  return table[index]?.ModifierValueSum || 0
}
