import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { AttributeRef, NW_ATTRIBUTE_TYPES, NW_MAX_CHARACTER_LEVEL } from '@nw-data/common'
import { Observable, combineLatest, of, switchMap } from 'rxjs'
import { NwDbService } from '~/nw'

// TODO: research if we can get these from playerattributes base file
const ATTRIBUTE_STEPS = [25, 50, 100, 150, 200, 250, 300, 350]
const ATTRIBUTE_MAX = 350

export interface AttributesState {
  level: number
  points: number
  base: Record<AttributeRef, number>
  assigned: Record<AttributeRef, number>
  buffs: Record<AttributeRef, number>
  magnify: number[]
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

@Injectable()
export class AttributesStore extends ComponentStore<AttributesState> {
  public readonly level$ = this.select(({ level }) => level)
  public readonly pointsSpent$ = this.select(({ assigned }) => sum(Object.values(assigned)))
  public readonly base$ = this.select(({ base }) => base)
  public readonly buffs$ = this.select(({ buffs }) => buffs)
  public readonly assigned$ = this.select(({ assigned }) => assigned)
  public readonly steps$ = this.select(of(ATTRIBUTE_STEPS), (list) => {
    return list.map((step, i) => {
      return {
        value: step,
        weight: (step - (list[i - 1] || 0)) / 50,
      }
    })
  })

  public readonly pointsAvailable$ = this.select(({ points, assigned }) => points - sum(Object.values(assigned)))
  public readonly stats$ = this.select(({ points, base, assigned, buffs, magnify }) => {
    const rows = NW_ATTRIBUTE_TYPES.map(({ ref, shortName, description }): AttributeState => {
      const ba = base?.[ref] || 0
      const bu = buffs?.[ref] || 0
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
        sliderEnd: ATTRIBUTE_MAX,
        magnify: 0,
      }
    })

    const defaultMagOrder = ['con', 'foc', 'str', 'dex', 'int']
    const sorted = [...rows].sort((a, b) => {
      if (b.total !== a.total) {
        return b.total - a.total
      }
      return defaultMagOrder.indexOf(a.ref) - defaultMagOrder.indexOf(b.ref)
    })
    for (let i = 0; i < magnify.length; i++) {
      sorted[i].magnify = (sorted[i].magnify || 0) + (magnify[i] || 0)
      sorted[i].total += magnify[i] || 0
    }
    return rows
  })

  public constructor(private nwDb: NwDbService) {
    super({
      level: NW_MAX_CHARACTER_LEVEL,
      points: 0,
      base: empty(),
      assigned: empty(),
      buffs: empty(),
      magnify: [],
    })
  }

  public readonly load = this.updater((state, data: Partial<AttributesState>) => {
    return {
      ...state,
      base: data.base || state.base || empty(),
      assigned: data.assigned || state.assigned || empty(),
      buffs: data.buffs || state.buffs || empty(),
      level: data.level,
      points: data.points,
      magnify: data.magnify || state.magnify || [],
    }
  })

  public readonly loadLazy = this.effect((value$: Observable<AttributesState>) => {
    return combineLatest({
      input: value$,
      data: this.nwDb.xpAmounts,
    }).pipe(
      switchMap(({ input, data }) => {
        input = {
          ...input,
        }
        data.forEach((it) => {
          if (it['Level Number'] < input.level) {
            input.points += it.AttributePoints
          }
        })
        this.load(input)
        return of(input.level)
      })
    )
  })

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
    result += value || 0
  }
  return result
}
