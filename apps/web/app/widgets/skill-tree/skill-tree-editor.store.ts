import { EventEmitter } from '@angular/core'
import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals'
import { NwWeaponType } from '~/nw/weapon-types'

export interface SkillTreeEditorState {
  weapon: string
  tree1: string[]
  tree2: string[]
}

export type SkillTreeEditorStore = InstanceType<typeof SkillTreeEditorStore>
export const SkillTreeEditorStore = signalStore(
  withState<SkillTreeEditorState>({
    weapon: null,
    tree1: [],
    tree2: [],
  }),
  withProps(() => {
    return {
      change: new EventEmitter<void>(),
    }
  }),
  withMethods((state) => {
    return {
      value: () => {
        return {
          weapon: state.weapon(),
          tree1: state.tree1(),
          tree2: state.tree2(),
        }
      },
      patchState: (update: Partial<SkillTreeEditorState>) => {
        patchState(state, update)
      },
      updateTree: (treeId: number, tree: string[]) => {
        if (treeId === 0) {
          patchState(state, { tree1: tree })
        }
        if (treeId === 1) {
          patchState(state, { tree2: tree })
        }
        state.change.next()
      },
      updateWeapon: (item: NwWeaponType) => {
        patchState(state, {
          weapon: item.WeaponTag,
          tree1: [],
          tree2: [],
        })
        state.change.next()
      },
    }
  }),
)
