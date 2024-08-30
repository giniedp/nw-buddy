import { computed, effect, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { NW_MAX_ENEMY_LEVEL } from '@nw-data/common'
import { FilterSpecification } from 'maplibre-gl'
import { combineLatest, map } from 'rxjs'
import { NwDataService } from '~/data'
import { BranchExpression } from '~/ui/expression-branch'

export interface FilterVitalsState {
  levelMin: number
  levelMax: number

  hideRandomEncounters: boolean
  hideDarknessEncounters: boolean
  hideGoblinEncounters: boolean

  outerOperators: JoinOperator[]

  idKey: string
  idOperators: JoinOperator[]
  idExpression: BranchExpression

  typeKey: string
  typeOperators: JoinOperator[]
  typeExpression: BranchExpression

  categoriesKey: string
  categoriesOperators: JoinOperator[]
  categoriesExpression: BranchExpression

  lootTagsKey: string
  lootTagsOperators: JoinOperator[]
  lootTagsExpression: BranchExpression

  poiTagsKey: string
  poiTagsOperators: JoinOperator[]
  poiTagsExpression: BranchExpression
}

export interface PresetRecord {
  name: string
  description: string
  context: {
    maxCount: number
    level: number
  }
  data: Preset
}
export interface Preset {
  id?: BranchExpression
  type?: BranchExpression
  categories?: BranchExpression
  lootTags?: BranchExpression
  poiTags?: BranchExpression
  minLevel?: number
  maxLevel?: number
}

export interface JoinOperator {
  value: string
  label: string
}
export interface StringFilter {
  key: string
  operator: string
  value: string
  label: string
}

export const FilterVitalsStore = signalStore(
  withState<FilterVitalsState>({
    levelMin: 1,
    levelMax: NW_MAX_ENEMY_LEVEL,
    hideRandomEncounters: false,
    hideDarknessEncounters: false,
    hideGoblinEncounters: false,
    outerOperators: [
      {
        value: 'all',
        label: 'AND',
      },
      {
        value: 'any',
        label: 'OR',
      },
    ],

    idKey: 'id',
    idExpression: { join: 'any', rows: [] },
    idOperators: [
      {
        value: '==',
        label: '==',
      },
      {
        value: '!=',
        label: '!=',
      },
    ],

    typeKey: 'type',
    typeExpression: { join: 'any', rows: [] },
    typeOperators: [
      {
        value: '==',
        label: '==',
      },
      {
        value: '!=',
        label: '!=',
      },
    ],

    categoriesKey: 'categories',
    categoriesExpression: { join: 'all', rows: [] },
    categoriesOperators: [
      {
        value: 'in',
        label: 'has',
      },
      {
        value: '!in',
        label: '!has',
      },
    ],

    lootTagsKey: 'lootTags',
    lootTagsExpression: { join: 'all', rows: [] },
    lootTagsOperators: [
      {
        value: 'in',
        label: 'has',
      },
      {
        value: '!in',
        label: '!has',
      },
    ],

    poiTagsKey: 'poiTags',
    poiTagsExpression: { join: 'all', rows: [] },
    poiTagsOperators: [
      {
        value: 'in',
        label: 'has',
      },
      {
        value: '!in',
        label: '!has',
      },
    ],
  }),
  withMethods((state) => {
    return {
      setHideRandomEncounters(hide: boolean) {
        patchState(state, {
          hideRandomEncounters: hide,
        })
      },
      setHideDarknessEncounters(hide: boolean) {
        patchState(state, {
          hideDarknessEncounters: hide,
        })
      },
      setHideGoblinEncounters(hide: boolean) {
        patchState(state, {
          hideGoblinEncounters: hide,
        })
      },
      setMinLevel(level: number) {
        patchState(state, {
          levelMin: level,
        })
      },
      setMaxLevel(level: number) {
        patchState(state, {
          levelMax: level,
        })
      },
      setTypeExpression(expression: BranchExpression) {
        patchState(state, {
          typeExpression: expression,
        })
      },
      setIdExpression(expression: BranchExpression) {
        patchState(state, {
          idExpression: expression,
        })
      },
      setCategoriesExpression(expression: BranchExpression) {
        patchState(state, {
          categoriesExpression: expression,
        })
      },
      setLootTagsExpression(expression: BranchExpression) {
        patchState(state, {
          lootTagsExpression: expression,
        })
      },
      setPoiTagsExpression(expression: BranchExpression) {
        patchState(state, {
          poiTagsExpression: expression,
        })
      },
      applyPreset(preset: Preset) {
        patchState(state, {
          levelMin: preset.minLevel ?? 1,
          levelMax: preset.maxLevel ?? NW_MAX_ENEMY_LEVEL,
          idExpression: preset.id ?? { join: 'any', rows: [] },
          typeExpression: preset.type ?? { join: 'any', rows: [] },
          categoriesExpression: preset.categories ?? { join: 'all', rows: [] },
          lootTagsExpression: preset.lootTags ?? { join: 'all', rows: [] },
          poiTagsExpression: preset.poiTags ?? { join: 'all', rows: [] },
        })
      },
    }
  }),
  withComputed(
    ({
      levelMin,
      levelMax,
      idExpression,
      typeExpression,
      poiTagsExpression,
      lootTagsExpression,
      categoriesExpression,
      hideRandomEncounters,
      hideDarknessEncounters,
      hideGoblinEncounters,
    }) => {
      return {
        layerFilter: computed(() => {
          const result: FilterSpecification = [
            'all',
            ['>=', ['get', 'level'], levelMin()],
            ['<=', ['get', 'level'], levelMax()],
          ]
          if (hideRandomEncounters()) {
            result.push(['!', ['in', 'random', ['get', 'encounter']]])
          }
          if (hideDarknessEncounters()) {
            result.push(['!', ['in', 'darkness', ['get', 'encounter']]])
          }
          if (hideGoblinEncounters()) {
            result.push(['!', ['in', 'goblin', ['get', 'encounter']]])
          }
          const expressions = [
            idExpression(),
            typeExpression(),
            poiTagsExpression(),
            lootTagsExpression(),
            categoriesExpression(),
          ]
          for (const expression of expressions) {
            if (!expression?.rows.length) {
              continue
            }
            const filters = expression.rows.map(({ left, operator, right }): FilterSpecification => {
              if (operator === '==' || operator === '!=') {
                return [operator as '==', ['get', left], right]
              }
              if (operator === '!in') {
                return ['!', ['in', right, ['get', left]]]
              }
              return [operator as 'in', right, ['get', left]]
            })
            result.push([expression.join, ...filters] as any)
          }
          return result
        }),
      }
    },
  ),
  withComputed(() => {
    const db = inject(NwDataService)
    const presets = toSignal(loadPresets(db), { initialValue: [] })
    return {
      presets,
    }
  }),
  withComputed(({ layerFilter }) => {
    effect(() => {
      console.log('layerFilter', layerFilter())
    })
    return {}
  }),
)

function loadPresets(db: NwDataService) {
  return combineLatest({
    tasks: db.seasonsRewardsTasks,
    stats: db.seasonsRewardsStatsKillMap,
  }).pipe(
    map(({ tasks, stats }) => {
      const presets: PresetRecord[] = []
      for (const task of tasks) {
        const stat = stats.get(task.SeasonsTrackedStatID)
        const preset: Preset = {}
        if (!stat) {
          continue
        }
        if (stat.VitalsCategories === 'Player') {
          continue
        }
        if (stat.Level) {
          preset.minLevel = stat.Level
          preset.maxLevel = NW_MAX_ENEMY_LEVEL
        }
        if (stat.TargetID) {
          const values = stat.TargetID.split(',').map((it) => it.toLowerCase())
          preset.id = {
            join: 'any',
            rows: values.map((value) => {
              return { left: 'id', operator: '==', right: value }
            }),
          }
        }
        if (stat.VitalsCategories) {
          const values = stat.VitalsCategories.split(',').map((it) => it.toLowerCase())
          preset.categories = {
            join: 'all',
            rows: values.map((value) => {
              return { left: 'categories', operator: 'in', right: value }
            }),
          }
        }
        if (stat.POITags) {
          const values = stat.POITags.split(',').map((it) => it.toLowerCase())
          preset.poiTags = {
            join: 'any',
            rows: values.map((value) => {
              return { left: 'poiTags', operator: 'in', right: value }
            }),
          }
        }
        if (stat.LootTags) {
          const values = stat.LootTags.split(',').map((it) => it.toLowerCase())
          preset.lootTags = {
            join: 'all',
            rows: values.map((value) => {
              return { left: 'lootTags', operator: 'in', right: value }
            }),
          }
        }

        if (Object.keys(preset).length && !task.Name.includes('placeholder')) {
          let name = task.Name
          let description = task.Description
          // if (name.includes('placeholder')) {
          //   name = `seasonsactivities_${stat.StatType}${task.TaskMaxValue}${stat.VitalsCategories}`
          //   description = null
          // }

          presets.push({
            name,
            description,
            data: preset,
            context: {
              maxCount: task.TaskMaxValue,
              level: stat.Level,
            },
          })
        }
      }
      return presets
    }),
  )
}