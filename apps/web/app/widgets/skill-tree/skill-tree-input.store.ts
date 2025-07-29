import { computed, EventEmitter } from '@angular/core'
import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { NW_MAX_WEAPON_LEVEL } from '@nw-data/common'
import { AbilityData } from '@nw-data/generated'
import { map, switchMap } from 'rxjs'
import { injectNwData } from '~/data'
import { CaseInsensitiveSet, eqCaseInsensitive } from '~/utils'
import { buildGrid, getGridSelection, updateGrid } from './skill-tree.model'

export interface SkillTreeInputState {
  isLoaded: boolean
  isLoading: boolean
  abilities: AbilityData[]
  points: number
  selection: string[]
}

export type SkillTreeInputStore = InstanceType<typeof SkillTreeInputStore>
export const SkillTreeInputStore = signalStore(
  withState<SkillTreeInputState>({
    isLoaded: false,
    isLoading: false,
    points: NW_MAX_WEAPON_LEVEL - 1,
    selection: [],
    abilities: [],
  }),
  withProps(() => {
    return {
      change: new EventEmitter<void>(),
    }
  }),
  withMethods((state) => {
    const db = injectNwData()
    return {
      setPoints: rxMethod<number>((source) => {
        return source.pipe(map((value) => patchState(state, { points: value })))
      }),
      setSelection: rxMethod<string[]>((source) => {
        return source.pipe(map((value) => patchState(state, { selection: value })))
      }),
      toggleAbility: (abilityId: string) => {
        const selection = new CaseInsensitiveSet(state.selection())
        if (selection.has(abilityId)) {
          selection.delete(abilityId)
        } else {
          selection.add(abilityId)
        }
        patchState(state, { selection: Array.from(selection) })
        state.change.emit()
      },
      load: rxMethod<{ weaponTag: string; treeId: number }>((source) => {
        return source.pipe(
          switchMap(async ({ treeId, weaponTag }) => {
            patchState(state, { isLoading: true })
            const abilities = await db.abilitiesAll().then((abilities) => {
              return abilities
                .filter(({ WeaponTag }) => eqCaseInsensitive(WeaponTag, weaponTag))
                .filter(({ TreeId }) => TreeId === treeId)
            })
            patchState(state, { abilities, isLoaded: true, isLoading: false })
          }),
        )
      }),
    }
  }),
  withProps(({ abilities, points, selection }) => {
    return {
      rows: computed(() => {
        const rows = buildGrid(abilities())
        updateGrid(rows, points(), selection())
        return rows
      }),
    }
  }),
  withProps(({ rows }) => {
    return {
      numRows: computed(() => rows().length),
      numCols: computed(() => rows()[0]?.length || 0),
      value: computed(() => getGridSelection(rows())),
    }
  }),
  withProps(({ value }) => {
    return {
      spent: computed(() => value().length),
    }
  }),
)

// ui_ability_unavailable_nopoints         "No points available"
// ui_ability_unavailable_noparent_lastrow "Purchase an ability in the previous row and 10 abilities in this tree to unlock"
// ui_ability_unavailable_parent_lastrow   "Purchase an ability in the previous row and 10 abilities in this tree including {parent} to unlock"
// ui_ability_unavailable_noparent         "Purchase an ability in the previous row to unlock"
// ui_ability_unavailable_parent_firstrow  "Purchase {parent} to unlock"
// ui_ability_unavailable_parent           "Purchase an ability in the previous row and {parent} to unlock"
// ui_ability_available                    "Click to select ability"
