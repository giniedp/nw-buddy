import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { combineLatest, Observable, of, switchMap } from 'rxjs'
import { AttributeRef, NwDbService, NW_ATTRIBUTE_TYPES } from '~/nw'
import { NW_MAX_CHARACTER_LEVEL } from '~/nw/utils/constants'

export interface AttributesState {
  level: number
  points: number
  base: Record<AttributeRef, number>
  assigned: Record<AttributeRef, number>
}

export interface AttributeState {
  ref: AttributeRef
  name: string
  description: string
  base: number
  assigned: number
  total: number
  inputMin: number
  inputMax: number
  sliderEnd: number
}

@Injectable()
export class AttributesStore extends ComponentStore<AttributesState> {
  public readonly level$ = this.select(({ level }) => level)
  public readonly pointsSpent$ = this.select(({ assigned }) => sum(Object.values(assigned)))
  public readonly assigned$ = this.select(({ assigned }) => assigned)
  public readonly pointsAvailable$ = this.select(({ points, assigned }) => points - sum(Object.values(assigned)))
  public readonly stats$ = this.select(({ points, base, assigned }) => {
    return NW_ATTRIBUTE_TYPES.map(({ ref, shortName, description }): AttributeState => {
      const b = (base?.[ref] || 0)
      const s = assigned?.[ref] || 0
      return {
        ref: ref,
        name: shortName,
        description: description,
        base: b,
        assigned: s,
        total: b + s,
        inputMin: b,
        inputMax: b + s + Math.max(0, points - sum(Object.values(assigned))),
        sliderEnd: 300,
      }
    })
  })

  public constructor(private nwDb: NwDbService) {
    super({
      level: NW_MAX_CHARACTER_LEVEL,
      points: 0,
      base: empty(),
      assigned: empty()
    })
  }

  public readonly load = this.updater(
    (
      state,
      data: {
        level: number
        points: number
        base?: Record<AttributeRef, number>
        assigned?: Record<AttributeRef, number>
      }
    ) => {
      return {
        ...state,
        base: data.base || state.base || empty(),
        assigned: data.assigned || state.assigned || empty(),
        level: data.level,
        points: data.points,
      }
    }
  )

  public readonly loadLazy = this.effect(
    (
      value$: Observable<{
        level: number
        points: number
        base: Record<AttributeRef, number>
        assigned: Record<AttributeRef, number>
      }>
    ) => {
      return combineLatest({
        input: value$,
        data: this.nwDb.xpAmounts,
      }).pipe(
        switchMap(({ input: { level, base, assigned, points }, data }) => {
          data.forEach((it) => {
            if (it['Level Number'] < level) {
              points += it.AttributePoints
            }
          })
          this.load({ level, points, base, assigned })
          return of(level)
        })
      )
    }
  )

  public readonly increment = this.updater((state, data: { attribute: string; value: number }) => {
    const left = state.points - sum(Object.values(state.assigned))
    const assigned = state.assigned[data.attribute] || 0
    return {

      ...state,
      assigned: {
        ...state.assigned,
        [data.attribute]: Math.max(0, assigned + Math.min(left, data.value)),
      },
    }
  })

  public readonly decrement = this.updater((state, data: { attribute: string; value: number }) => {
    const assigned = state.assigned[data.attribute] || 0
    return {
      ...state,
      assigned: {
        ...state.assigned,
        [data.attribute]: Math.max(0, assigned - data.value),
      },
    }
  })

  public readonly update = this.updater((state, data: { attribute: string; value: number }) => {
    const base = state.base[data.attribute] || 0
    const assigned = state.assigned[data.attribute] || 0
    const left = state.points - sum(Object.values(state.assigned)) + assigned
    return {
      ...state,
      assigned: {
        ...state.assigned,
        [data.attribute]: Math.max(0, Math.min(left, data.value - base)),
      },
    }
  })
}

function empty() {
  return {
    str: 0,
    dex: 0,
    int: 0,
    foc: 0,
    con: 0,
  }
}
function sum(values: number[]) {
  let result = 0
  for (const value of values) {
    result += (value || 0)
  }
  return result
}
