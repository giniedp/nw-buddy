import { computed, inject } from '@angular/core'
import { rxResource } from '@angular/core/rxjs-interop'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { map } from 'rxjs'
import { SkillTreesService } from './skill-trees.service'
import { skillTreeProps } from './with-skill-tree-props'

export interface SkillTreeStoreState {
  userId: string
  skillTreeId: string
}

export type SkillTreeStore = InstanceType<typeof SkillTreeStore>
export const SkillTreeStore = signalStore(
  withState<SkillTreeStoreState>({
    userId: null,
    skillTreeId: null,
  }),
  withMethods((state) => {
    return {
      connect: rxMethod<{ userId: string; recordId: string }>((source) => {
        return source.pipe(map(({ userId, recordId }) => patchState(state, { userId, skillTreeId: recordId })))
      }),
    }
  }),
  withComputed(({ userId, skillTreeId }) => {
    const skills = inject(SkillTreesService)
    const resource = rxResource({
      params: () => ({ userId: userId(), skillTreeId: skillTreeId() }),
      stream: ({ params: { userId, skillTreeId } }) => {
        return skills.observeRecord({ userId, id: skillTreeId })
      },
      defaultValue: null,
    })
    const skillTree = computed(() => (resource.hasValue() ? resource.value() : null))
    return {
      isLoading: resource.isLoading,
      hasError: resource.error,
      skillTree,
      ...skillTreeProps({ skillTree }),
    }
  }),
)
