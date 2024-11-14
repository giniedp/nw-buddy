import { computed } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
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
  withMethods((state) => {
    return {
      setLevel: (level: number) => patchState(state, { level }),
      setBase: (base: Record<AttributeRef, number>) => patchState(state, { base: base || empty(ATTRIBUTE_MIN) }),
      setAssigned: (assigned: Record<AttributeRef, number>) => patchState(state, { assigned: assigned || empty() }),
      setBuffs: (buffs: Record<AttributeRef, number>) => patchState(state, { buffs: buffs || empty() }),
      setMagnify: (magnify: number[]) => patchState(state, { magnify: magnify || [] }),
      setMagnifyPlacement: (magnifyPlacement: AttributeRef) => patchState(state, { magnifyPlacement }),
      setUnlocked: (unlocked: boolean) => patchState(state, { unlocked }),
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

// @Injectable()
// export class AttributesStoreOld extends ComponentStore<AttributesState> {
//   private db = injectNwData()
//   public readonly level$ = this.select(({ level }) => level)
//   public readonly pointsSpent$ = this.select(({ assigned }) => sum(Object.values(assigned)))
//   public readonly base$ = this.select(({ base }) => base)
//   public readonly buffs$ = this.select(({ buffs }) => buffs)
//   public readonly assigned$ = this.select(({ assigned }) => assigned)
//   public readonly magnifyPlacement$ = this.select(({ magnifyPlacement }) => magnifyPlacement)
//   public readonly steps$ = this.select(of(ATTRIBUTE_STEPS), (list) => {
//     return list.map((step, i) => {
//       return {
//         value: step,
//         weight: (step - (list[i - 1] || 0)) / 50,
//       }
//     })
//   })

//   public readonly pointsAvailable$ = this.select(({ points, assigned }) => points - sum(Object.values(assigned)))
//   public readonly stats$ = this.select(({ points, base, assigned, buffs, magnify, magnifyPlacement }) => {
//     const rows = NW_ATTRIBUTE_TYPES.map(({ ref, shortName, description }): AttributeState => {
//       const vBase = base?.[ref] || 0
//       const vBuff = buffs?.[ref] || 0
//       const vAssign = assigned?.[ref] || 0
//       return {
//         ref: ref,
//         name: shortName,
//         description: description,
//         base: vBase,
//         buffs: vBuff,
//         assigned: vAssign,
//         total: vBase + vBuff + vAssign,
//         inputMin: 0,
//         inputMax: vAssign + Math.max(0, points - sum(Object.values(assigned))),
//         sliderEnd: ATTRIBUTE_MAX,
//         magnify: 0,
//       }
//     })

//     const boost = solveAttributePlacingMods({
//       stats: rows.map((it) => {
//         return { key: it.ref, value: it.total }
//       }),
//       placingMods: magnify,
//       placement: magnifyPlacement,
//     })
//     boost.forEach(({ key, value }) => {
//       const row = rows.find((it) => it.ref === key)
//       if (row) {
//         row.magnify = value
//         row.total += value
//       }
//     })

//     return rows
//   })

//   public readonly totalDex$ = this.select(this.stats$, (stats) => selectStatTotal(stats, 'dex'))
//   public readonly totalStr$ = this.select(this.stats$, (stats) => selectStatTotal(stats, 'str'))
//   public readonly totalInt$ = this.select(this.stats$, (stats) => selectStatTotal(stats, 'int'))
//   public readonly totalFoc$ = this.select(this.stats$, (stats) => selectStatTotal(stats, 'foc'))
//   public readonly totalCon$ = this.select(this.stats$, (stats) => selectStatTotal(stats, 'con'))

//   public constructor() {
//     super({
//       level: NW_MAX_CHARACTER_LEVEL,
//       points: 0,
//       base: empty(),
//       assigned: empty(),
//       buffs: empty(),
//       magnify: [],
//       magnifyPlacement: null,
//     })
//   }

//   public readonly load = this.updater((state, data: Partial<AttributesState>) => {
//     return {
//       ...state,
//       base: data.base || state.base || empty(),
//       assigned: data.assigned || state.assigned || empty(),
//       buffs: data.buffs || state.buffs || empty(),
//       level: data.level,
//       points: data.points,
//       magnify: data.magnify || state.magnify || [],
//       magnifyPlacement: data.magnifyPlacement !== undefined ? data.magnifyPlacement : state.magnifyPlacement,
//     }
//   })

//   public readonly loadLazy = this.effect((value$: Observable<AttributesState>) => {
//     return combineLatest({
//       input: value$,
//       data: this.nwDb.xpAmounts,
//     }).pipe(
//       switchMap(({ input, data }) => {
//         input = {
//           ...input,
//         }
//         data.forEach((it) => {
//           if (it['Level Number'] < input.level) {
//             input.points += it.AttributePoints
//           }
//         })
//         this.load(input)
//         return of(input.level)
//       }),
//     )
//   })

//   public readonly update = this.updater((state, data: { attribute: string; value: number }) => {
//     const base = state.base[data.attribute] || 0
//     const buff = state.buffs[data.attribute] || 0
//     const assigned = state.assigned[data.attribute] || 0
//     const left = state.points - sum(Object.values(state.assigned)) + assigned
//     return {
//       ...state,
//       assigned: {
//         ...state.assigned,
//         [data.attribute]: Math.max(0, Math.min(left, data.value - base - buff)),
//       },
//     }
//   })
// }

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
