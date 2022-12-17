import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { combineLatest, Observable, of, switchMap } from 'rxjs'
import { NwDbService } from '~/nw'
import { AttributeRef, NW_ATTRIBUTE_TYPES } from '~/nw/attributes'
import { NW_MAX_CHARACTER_LEVEL } from '~/nw/utils/constants'

export interface AttributesState {
  level: number
  points: number
  base: Record<AttributeRef, number>
  assigned: Record<AttributeRef, number>
  buffs: Record<AttributeRef, number>
}

export interface AttributeState {
  ref: AttributeRef
  name: string
  description: string
  base: number
  assigned: number
  buffs: number
  total: number
  inputMin: number
  inputMax: number
  sliderEnd: number
}

@Injectable()
export class AttributesStore extends ComponentStore<AttributesState> {
  public readonly level$ = this.select(({ level }) => level)
  public readonly pointsSpent$ = this.select(({ assigned }) => sum(Object.values(assigned)))
  public readonly base$ = this.select(({ base }) => base)
  public readonly buffs$ = this.select(({ buffs }) => buffs)
  public readonly assigned$ = this.select(({ assigned }) => assigned)
  public readonly pointsAvailable$ = this.select(({ points, assigned }) => points - sum(Object.values(assigned)))
  public readonly stats$ = this.select(({ points, base, assigned, buffs }) => {
    return NW_ATTRIBUTE_TYPES.map(({ ref, shortName, description }): AttributeState => {
      const ba = (base?.[ref] || 0)
      const bu = (buffs?.[ref] || 0)
      const as = assigned?.[ref] || 0
      return {
        ref: ref,
        name: shortName,
        description: description,
        base: ba,
        buffs: bu,
        assigned: as,
        total: ba + bu + as,
        inputMin: ba + bu,
        inputMax: ba + bu + as + Math.max(0, points - sum(Object.values(assigned))),
        sliderEnd: 300,
      }
    })
  })

  public constructor(private nwDb: NwDbService) {
    super({
      level: NW_MAX_CHARACTER_LEVEL,
      points: 0,
      base: empty(),
      assigned: empty(),
      buffs: empty()
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
        buffs?: Record<AttributeRef, number>
      }
    ) => {
      return {
        ...state,
        base: data.base || state.base || empty(),
        assigned: data.assigned || state.assigned || empty(),
        buffs: data.buffs || state.buffs || empty(),
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
        buffs: Record<AttributeRef, number>
      }>
    ) => {
      return combineLatest({
        input: value$,
        data: this.nwDb.xpAmounts,
      }).pipe(
        switchMap(({ input: { level, base, assigned, points, buffs }, data }) => {
          data.forEach((it) => {
            if (it['Level Number'] < level) {
              points += it.AttributePoints
            }
          })
          this.load({ level, points, base, assigned, buffs })
          return of(level)
        })
      )
    }
  )

  public readonly update = this.updater((state, data: { attribute: string; value: number }) => {
    const base = state.base[data.attribute] || 0
    const buff = state.buffs[data.attribute] || 0
    const assigned = state.assigned[data.attribute] || 0
    const left = state.points - sum(Object.values(state.assigned)) + assigned
    return {
      ...state,
      assigned: {
        ...state.assigned,
        [data.attribute]: Math.max(0, Math.min(left, data.value - base - buff)),
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
