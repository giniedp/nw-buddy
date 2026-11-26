import { computed } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { NW_MAX_ENEMY_LEVEL } from '@nw-data/common'
import { NwData } from '@nw-data/db'
import { FilterSpecification } from 'maplibre-gl'
import { combineLatest, map } from 'rxjs'
import { injectNwData } from '~/data'
import { BranchExpression, BranchExpressionRow } from '~/ui/expression-branch'
import { VitalsFeatureProperties } from './data/types'
import { withPersistedState } from './with-persisted-state'

const KNOWN_ENCOUNTER_TYPES = [
  '',
  'arena',
  'catacombs',
  'daily',
  'darkness',
  'dungeon',
  'gimmick',
  'goblin',
  'hunt_the_hunter',
  'quest',
  'raid',
  'random',
  'sandworm',
  'siege',
  'springtide',
  'summermedley',
  'trial',
  'worldboss',
  'worldevent',
  'other',
]

export interface FilterVitalsState {
  levelMin: number
  levelMax: number

  knownEncounterTypes: string[]
  hideEncounter: string[]

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

export type ExpressionKey =
  | 'idExpression'
  | 'typeExpression'
  | 'categoriesExpression'
  | 'lootTagsExpression'
  | 'poiTagsExpression'

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
    knownEncounterTypes: KNOWN_ENCOUNTER_TYPES,
    hideEncounter: [],
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
  withPersistedState<FilterVitalsState>('zone-map-vitals', [
    'levelMin',
    'levelMax',
    'hideEncounter',
    'idExpression',
    'typeExpression',
    'categoriesExpression',
    'lootTagsExpression',
    'poiTagsExpression',
  ]),
  withMethods((state) => {
    return {
      /**
       * Adds or removes the creature from the ID filter (rows `id == value`, joined by OR)
       */
      toggleCreature(id: string) {
        patchState(state, ({ idExpression }) => {
          const rows = idExpression.rows.filter((it) => !(it.operator === '==' && it.right === id))
          if (rows.length === idExpression.rows.length) {
            rows.push({ left: 'id', operator: '==', right: id })
          }
          return {
            idExpression: { join: 'any', rows },
          }
        })
      },
      clearAll() {
        patchState(state, {
          levelMin: 1,
          levelMax: NW_MAX_ENEMY_LEVEL,
          hideEncounter: [],
          idExpression: { join: 'any', rows: [] },
          typeExpression: { join: 'any', rows: [] },
          categoriesExpression: { join: 'all', rows: [] },
          lootTagsExpression: { join: 'all', rows: [] },
          poiTagsExpression: { join: 'all', rows: [] },
        })
      },
      toggleEncounter(type: string) {
        patchState(state, ({ hideEncounter }) => {
          if (hideEncounter.includes(type)) {
            hideEncounter = hideEncounter.filter((it) => it !== type)
          } else {
            hideEncounter = [...hideEncounter, type]
          }
          return {
            hideEncounter,
          }
        })
      },
      toggleAllEncounter() {
        patchState(state, ({ hideEncounter, knownEncounterTypes }) => {
          const hasValues = hideEncounter.length > 0
          return {
            hideEncounter: hasValues ? [] : [...knownEncounterTypes],
          }
        })
      },
      setAllEncounter(value: boolean) {
        patchState(state, ({ knownEncounterTypes }) => {
          const hideEncounter = value ? [...knownEncounterTypes] : []
          return {
            hideEncounter,
          }
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
      hideEncounter,
      knownEncounterTypes,
    }) => {
      return {
        encounterTypes: computed(() => {
          return knownEncounterTypes().map((id) => {
            return {
              id,
              label: encounterLabel(id),
              enabled: !hideEncounter().includes(id),
            }
          })
        }),
        layerFilter: computed(() => {
          const result: FilterSpecification = [
            'all',
            ['>=', ['get', 'level'], levelMin()],
            ['<=', ['get', 'level'], levelMax()],
          ]
          if (hideEncounter()?.length) {
            for (const type of hideEncounter()) {
              if (type) {
                result.push(['!', ['in', type, ['get', 'encounter']]])
              } else {
                result.push(['!=', 0, ['length', ['get', 'encounter']]])
              }
            }
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
        /**
         * The layer filter as a JS predicate, for counting the visible points
         */
        matcher: computed(() => {
          const min = levelMin()
          const max = levelMax()
          const hidden = hideEncounter() || []
          const expressions = [
            idExpression(),
            typeExpression(),
            poiTagsExpression(),
            lootTagsExpression(),
            categoriesExpression(),
          ].filter((it) => !!it?.rows.length)
          return (props: VitalsFeatureProperties) => {
            if (props.level < min || props.level > max) {
              return false
            }
            for (const type of hidden) {
              if (type ? props.encounter.includes(type) : !props.encounter.length) {
                return false
              }
            }
            for (const expression of expressions) {
              const matches = expression.rows.map((row) => matchRow(props, row))
              const ok = expression.join === 'all' ? matches.every((it) => it) : matches.some((it) => it)
              if (!ok) {
                return false
              }
            }
            return true
          }
        }),
      }
    },
  ),
  withComputed(() => {
    const db = injectNwData()
    const presets = toSignal(loadPresets(db), { initialValue: [] })
    return {
      presets,
    }
  }),
)

export function encounterLabel(id: string) {
  if (!id) {
    return 'No encounter'
  }
  const text = id.replace(/_/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function matchRow(props: VitalsFeatureProperties, row: BranchExpressionRow) {
  const value = props[row.left as keyof VitalsFeatureProperties]
  switch (row.operator) {
    case '==': {
      return value === row.right
    }
    case '!=': {
      return value !== row.right
    }
    case '!in': {
      return !(Array.isArray(value) && (value as string[]).includes(row.right))
    }
    default: {
      return Array.isArray(value) && (value as string[]).includes(row.right)
    }
  }
}

function loadPresets(db: NwData) {
  return combineLatest({
    tasks: db.seasonsRewardsTasksAll(),
    stats: db.seasonsRewardsStatsKillByIdMap(),
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
