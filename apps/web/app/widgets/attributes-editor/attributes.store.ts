import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { combineLatest, Observable, of, switchMap } from 'rxjs'
import { NwDbService } from '~/nw'
import { NW_MAX_CHARACTER_LEVEL } from '~/nw/utils/constants'

export type AttributeName = 'str' | 'dex' | 'int' | 'foc' | 'con'
export interface AttributesState {
  level: number
  points: number
  base: Record<AttributeName, number>
  assigned: Record<AttributeName, number>
}

export interface AttributeState {
  name: AttributeName
  base: number
  assigned: number
  total: number
  max: number
}

export const ATTRIBUTE_IDS: AttributeName[] = ['str', 'dex', 'int', 'foc', 'con']

@Injectable()
export class AttributesStore extends ComponentStore<AttributesState> {
  public static names = ATTRIBUTE_IDS
  public readonly level$ = this.select(({ level }) => level)
  public readonly pointsSpent$ = this.select(({ assigned }) => sum(Object.values(assigned)))
  public readonly assigned$ = this.select(({ assigned }) => assigned)
  public readonly pointsAvailable$ = this.select(({ points, assigned }) => points - sum(Object.values(assigned)))
  public readonly stats$ = this.select(({ base, assigned }) => {
    return ATTRIBUTE_IDS.map((key): AttributeState => {
      const b = (base?.[key] || 0)
      const s = assigned?.[key] || 0
      return {
        name: key,
        base: b,
        assigned: s,
        total: b + s,
        max: 300,
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
        base?: Record<AttributeName, number>
        assigned?: Record<AttributeName, number>
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
        base: Record<AttributeName, number>
        assigned: Record<AttributeName, number>
      }>
    ) => {
      return combineLatest({
        input: value$,
        data: this.nwDb.xpAmounts,
      }).pipe(
        switchMap(({ input: { level, base, assigned }, data }) => {
          let points = 0
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
    const base = state.assigned[data.attribute] || 0
    return {

      ...state,
      assigned: {
        ...state.assigned,
        [data.attribute]: Math.max(0, base + Math.min(left, data.value)),
      },
    }
  })

  public readonly decrement = this.updater((state, data: { attribute: string; value: number }) => {
    const base = state.assigned[data.attribute] || 0
    return {
      ...state,
      assigned: {
        ...state.assigned,
        [data.attribute]: Math.max(0, base - data.value),
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
    result += value
  }
  return result
}
