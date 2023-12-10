import { Injectable, inject } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { AttributeRef, NW_MAX_CHARACTER_LEVEL, damageForTooltip, damageScaleAttrs } from '@nw-data/common'
import { Affixstats, Attributedexterity, ItemdefinitionsWeapons } from '@nw-data/generated'
import { ChartConfiguration } from 'chart.js'
import { combineLatest, map } from 'rxjs'
import { NwDbService } from '~/nw'
import { selectStream } from '~/utils'

export interface AttributesScalingState {
  playerLevel: number
  weaponId: string
  affixId: string
  gearScore: number
  stats: Record<AttributeRef, number>
  showTotal: boolean
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
  private db = inject(NwDbService)

  protected readonly scalingAffixId$ = this.select(({ affixId }) => affixId)
  protected readonly scalingAffix$ = this.select(this.db.affixStat(this.scalingAffixId$), (it) => it)
  protected readonly weaponId$ = this.select(({ weaponId }) => weaponId)
  protected readonly weapon$ = this.select(this.db.weapon(this.weaponId$), (it) => it)

  protected readonly playerLevel$ = this.select(({ playerLevel }) => playerLevel)
  protected readonly gearScore$ = this.select(({ gearScore }) => gearScore)
  public readonly showTotal$ = this.select(({ showTotal }) => showTotal)
  protected readonly stats$ = this.select(({ stats }) => stats)
  protected readonly tables$ = selectStream(
    combineLatest({
      dex: this.db.attrDex,
      str: this.db.attrStr,
      int: this.db.attrInt,
      foc: this.db.attrFoc,
      con: this.db.attrCon,
    })
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
    }
  )

  public chartConfig$ = selectStream(
    {
      levels: this.tables$.pipe(map((it) => it.dex.map((it) => it.Level))),
      tables: this.tables$,
      damageStats: this.damageStats$,
      stats: this.stats$,
      showTotal: this.showTotal$,
    },
    (data) =>
      selectChartConfig({
        levels: data.levels,
        tables: data.tables,
        damageStats: data.damageStats,
        stats: data.stats,
        showTotal: data.showTotal,
      }),
    {
      debounce: true,
    }
  )

  public constructor() {
    super({
      playerLevel: NW_MAX_CHARACTER_LEVEL,
      weaponId: null,
      affixId: null,
      gearScore: null,
      showTotal: false,
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

export type ModifierTable = Array<Pick<Attributedexterity, 'ModifierValue' | 'ModifierValueSum' | 'Level'>>

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
  weapon: ItemdefinitionsWeapons
  affix: Affixstats
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
  const affixScale = damageScaleAttrs(affix)
  const weaponScale = damageScaleAttrs(weapon)
  const affixPercent = affix?.DamagePercentage || 0
  const weaponPercent = 1 - affixPercent
  const affixDamage = damageForTooltip({
    attrSums,
    playerLevel,
    gearScore,
    weapon,
    weaponScale: affixScale,
  })
  const weaponDamage = damageForTooltip({
    attrSums,
    playerLevel,
    gearScore,
    weapon,
    weaponScale: weaponScale,
  })

  if (affix?.PreferHigherScaling && affixDamage > weaponDamage) {
    return {
      value: weaponDamage * weaponPercent + affixDamage * affixPercent,
      scale: {
        dex: weaponScale.dex * weaponPercent + affixScale.dex * affixPercent,
        str: weaponScale.str * weaponPercent + affixScale.str * affixPercent,
        int: weaponScale.int * weaponPercent + affixScale.int * affixPercent,
        foc: weaponScale.foc * weaponPercent + affixScale.foc * affixPercent,
        con: weaponScale.con * weaponPercent + affixScale.con * affixPercent,
      },
    }
  }

  // if (affix?.PreferHigherScaling && affixDamage > weaponDamage) {
  //   return {
  //     invalidValue: weaponDamage * weaponPercent + affixDamage * affixPercent,
  //     value: affixDamage,
  //     scale: affixScale,
  //   }
  // }

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
  showTotal,
}: {
  levels: number[]
  tables: Record<AttributeRef, Array<Pick<Attributedexterity, 'ModifierValue' | 'ModifierValueSum'>>>
  damageStats: WeaponDamageStats
  stats: Record<AttributeRef, number>
  showTotal: boolean
}): ChartConfiguration {
  const scale = damageStats.scale
  const keys: AttributeRef[] = Object.keys(tables).filter((key) => !!scale[key]) as AttributeRef[]
  return {
    type: 'line',
    options: {
      animation: false,
      backgroundColor: '#FFF',
      elements: {
        point: {
          hoverRadius: (context) => {
            return stats[context.dataset['key']] === levels[context.dataIndex] ? 10 : 5
          },
          radius: (context) => {
            return stats[context.dataset['key']] === levels[context.dataIndex] ? 8 : 3
          },
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
            label: `${key.toUpperCase()} scale ${showTotal ? '' : 'increment'}`,
            data: levels.map((_, index) => {
              index = Math.min(Math.max(index, 0), table.length - 1)
              if (showTotal) {
                return table[index]?.ModifierValueSum * scale[key] || 0
              }
              return table[index]?.ModifierValue * scale[key] || 0
            }),
            backgroundColor: STAT_COLORS[key],
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
