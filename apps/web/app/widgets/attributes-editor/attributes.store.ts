import { computed, EventEmitter } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { patchState, signalMethod, signalStore, withComputed, withMethods, withProps, withState } from '@ngrx/signals'
import { AttributeRef, NW_ATTRIBUTE_TYPES, NW_MAX_CHARACTER_LEVEL, solveAttributePlacingMods } from '@nw-data/common'
import { from } from 'rxjs'
import { injectNwData } from '~/data'

// TODO: research if we can get these from playerattributes base file
const ATTRIBUTE_STEPS = [25, 50, 100, 150, 200, 250, 300, 350]
const ATTRIBUTE_MAX = 350
const ATTRIBUTE_MIN = 5

export interface AttributesState {
  level: number
  unlocked: boolean
  base: Record<AttributeRef, number>
  assigned: Record<AttributeRef, number>
  buffs: Record<AttributeRef, number>
  magnify: number[]
  magnifyPlacement: AttributeRef
}

export interface AttributeState {
  ref: AttributeRef
  name: string
  description: string
  base: number
  assigned: number
  buffs: number
  magnify: number
  total: number
  inputMin: number
  inputMax: number
  sliderEnd: number
}

export const AttributesStore = signalStore(
  withState<AttributesState>({
    level: NW_MAX_CHARACTER_LEVEL,
    unlocked: false,
    base: empty(ATTRIBUTE_MIN),
    assigned: empty(),
    buffs: empty(),
    magnify: [],
    magnifyPlacement: null,
  }),
  withProps(() => {
    return {
      assignedChanged: new EventEmitter<Record<AttributeRef, number>>(),
      magnifyPlacementChanged: new EventEmitter<AttributeRef>(),
    }
  }),
  withMethods((state) => {
    return {
      setLevel: signalMethod((level: number) => {
        patchState(state, { level })
      }),
      setBase: signalMethod((base: Record<AttributeRef, number>) => {
        patchState(state, { base: base || empty(ATTRIBUTE_MIN) })
      }),
      setAssigned: signalMethod((assigned: Record<AttributeRef, number>) => {
        patchState(state, { assigned: assigned || empty() })
      }),
      setBuffs: signalMethod((buffs: Record<AttributeRef, number>) => {
        patchState(state, { buffs: buffs || empty() })
      }),
      setMagnify: signalMethod((magnify: number[]) => {
        patchState(state, { magnify: magnify || [] })
      }),
      setMagnifyPlacement: signalMethod((magnifyPlacement: AttributeRef) => {
        patchState(state, { magnifyPlacement })
      }),
      setUnlocked: signalMethod((unlocked: boolean) => {
        patchState(state, { unlocked })
      }),
    }
  }),
  withComputed(({ level, unlocked }) => {
    const db = injectNwData()
    const xpLevels = toSignal(from(db.xpLevels()), { initialValue: [] })
    return {
      points: computed(() => {
        let sum = 0
        if (unlocked()) {
          sum += 5 * 36 // gs 725 armor
          sum += 3 * 36 // gs 725 jevelry
          sum += 2 * 42 // gs 725 weapon
          sum += 1 * 48 // buff food
        }
        for (const row of xpLevels()) {
          if (row['Level Number'] < level()) {
            sum += row.AttributePoints
          }
        }
        return sum
      }),
    }
  }),
  withComputed(({ points, base, assigned, buffs, magnify, magnifyPlacement }) => {
    const pointsSpent = computed(() => sum(Object.values(assigned())))
    const pointsAvailable = computed(() => points() - pointsSpent())
    return {
      pointsSpent,
      pointsAvailable,
      steps: computed(() => {
        return ATTRIBUTE_STEPS.map((step, i) => {
          return {
            value: step,
            weight: (step - (ATTRIBUTE_STEPS[i - 1] || 0)) / 50,
          }
        })
      }),
      stats: computed(() => {
        const rows = NW_ATTRIBUTE_TYPES.map(({ ref, shortName, description }): AttributeState => {
          const vBase = base()?.[ref] || 0
          const vBuff = buffs()?.[ref] || 0
          const vAssign = assigned()?.[ref] || 0
          return {
            ref: ref,
            name: shortName,
            description: description,
            base: vBase,
            buffs: vBuff,
            assigned: vAssign,
            total: vBase + vBuff + vAssign,
            inputMin: 0,
            inputMax: vAssign + Math.max(0, pointsAvailable()),
            sliderEnd: ATTRIBUTE_MAX,
            magnify: 0,
          }
        })

        const boost = solveAttributePlacingMods({
          stats: rows.map((it) => {
            return { key: it.ref, value: it.total }
          }),
          placingMods: magnify(),
          placement: magnifyPlacement(),
        })
        boost.forEach(({ key, value }) => {
          const row = rows.find((it) => it.ref === key)
          if (row) {
            row.magnify = value
            row.total += value
          }
        })

        return rows
      }),
    }
  }),
  withComputed(({ stats }) => {
    return {
      totalDex: computed(() => selectStatTotal(stats(), 'dex')),
      totalStr: computed(() => selectStatTotal(stats(), 'str')),
      totalInt: computed(() => selectStatTotal(stats(), 'int')),
      totalFoc: computed(() => selectStatTotal(stats(), 'foc')),
      totalCon: computed(() => selectStatTotal(stats(), 'con')),
    }
  }),
  withMethods((state) => {
    return {
      update: (data: { attribute: AttributeRef; value: number }) => {
        const base = state.base()[data.attribute] || 0
        const buff = state.buffs()[data.attribute] || 0
        const assigned = state.assigned()[data.attribute] || 0
        const left = state.points() - state.pointsSpent() + assigned
        patchState(state, {
          assigned: {
            ...state.assigned(),
            [data.attribute]: Math.max(0, Math.min(left, data.value - base - buff)),
          },
        })
      },
    }
  }),
)

function empty(value = 0) {
  return {
    str: value,
    dex: value,
    int: value,
    foc: value,
    con: value,
  }
}
function sum(values: number[]) {
  let result = 0
  for (const value of values) {
    result += value || 0
  }
  return result
}

function selectStatTotal(stats: Array<AttributeState>, ref: AttributeRef) {
  const row = stats.find((it) => it.ref === ref)
  return row ? row.total : 0
}
