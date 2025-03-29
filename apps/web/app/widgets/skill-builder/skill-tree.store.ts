import { computed } from '@angular/core'
import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals'
import { NW_MAX_WEAPON_LEVEL } from '@nw-data/common'
import { AbilityData } from '@nw-data/generated'
import { injectNwData, withStateLoader } from '~/data'
import { CaseInsensitiveSet, eqCaseInsensitive } from '~/utils'
import { buildGrid, getGridSelection, updateGrid } from './skill-tree.model'
import { eq } from 'lodash'

export interface SkillTreeEditorState {
  abilities: AbilityData[]
  points: number
  selection: string[]
}

export const SkillTreeStore = signalStore(
  withState<Pick<SkillTreeEditorState, 'abilities'>>({
    abilities: [],
  }),
  withStateLoader(() => {
    const db = injectNwData()
    return {
      load: async ({ weaponTag, treeId }: { weaponTag: string; treeId: number }) => {
        const abilities = await db.abilitiesAll().then((abilities) => {
          return abilities
            .filter(({ WeaponTag }) => eqCaseInsensitive(WeaponTag, weaponTag))
            .filter(({ TreeId }) => TreeId === treeId)
        })
        return {
          abilities,
        }
      },
    }
  }),
  withState<Pick<SkillTreeEditorState, 'points' | 'selection'>>({
    points: NW_MAX_WEAPON_LEVEL - 1,
    selection: [],
  }),
  withMethods((state) => {
    return {
      setSelection: (selection: string[]) => {
        if (!eq(state.selection(), selection)) {
          patchState(state, { selection })
        }
      },
      setPoints: (points: number) => {
        patchState(state, { points })
      },
      addAbility: (name: string) => {
        const selection = new CaseInsensitiveSet(state.selection())
        selection.add(name)
        patchState(state, {
          selection: Array.from(selection),
        })
      },
      removeAbility: (name: string) => {
        const selection = new CaseInsensitiveSet(state.selection())
        selection.delete(name)
        patchState(state, {
          selection: Array.from(selection),
        })
      },
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
      selection: computed(() => getGridSelection(rows())),
    }
  }),
  withProps(({ selection }) => {
    return {
      spent: computed(() => selection().length),
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
