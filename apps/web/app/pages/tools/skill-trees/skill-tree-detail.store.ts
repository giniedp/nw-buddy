import { computed, inject } from '@angular/core'
import { rxResource } from '@angular/core/rxjs-interop'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { map } from 'rxjs'
import { SkillBuildsService } from '~/data'
import { BackendService } from '~/data/backend'

export interface SkillTreeDetailState {
  userId: string
  recordId: string
  readonly: boolean
}

export const SkillTreeDetailStore = signalStore(
  withState<SkillTreeDetailState>({
    userId: null,
    recordId: null,
    readonly: false,
  }),
  withComputed(({ userId, recordId }) => {
    const skills = inject(SkillBuildsService)
    const resource = rxResource({
      params: () => {
        return { userId: userId(), recordId: recordId() }
      },
      stream: ({ params: { userId, recordId } }) => {
        return skills.observeRecord({ userId, id: recordId })
      },
      defaultValue: null,
    })
    return {
      isLoading: resource.isLoading,
      hasError: resource.error,
      record: computed(() => (resource.hasValue() ? resource.value() : null)),
    }
  }),
  withComputed(({ readonly, record }) => {
    const backend = inject(BackendService)
    const sessionUserId = computed(() => backend.session()?.id)
    const canImport = computed(() => {
      const recordUserId = record()?.userId
      if (!recordUserId || recordUserId === 'local') {
        return false
      }
      return recordUserId !== sessionUserId()
    })
    return {
      canEdit: computed(() => !readonly() && !canImport()),
      canImport: canImport,
      isPublished: computed(() => record()?.status === 'public'),
    }
  }),
  withMethods((state) => {
    return {
      connect: rxMethod<{ userId: string; recordId: string }>((source) => {
        return source.pipe(map(({ userId, recordId }) => patchState(state, { userId, recordId })))
      }),
    }
  }),
)
