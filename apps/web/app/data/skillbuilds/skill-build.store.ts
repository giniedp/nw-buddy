import { computed, inject } from '@angular/core'
import { rxResource } from '@angular/core/rxjs-interop'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { map } from 'rxjs'
import { SkillBuildsService } from '~/data'
import { BackendService } from '~/data/backend'

export interface SkillBuildState {
  userId: string
  recordId: string
}

export type SkillBuildStore = InstanceType<typeof SkillBuildStore>
export const SkillBuildStore = signalStore(
  withState<SkillBuildState>({
    userId: null,
    recordId: null,
  }),
  withMethods((state) => {
    return {
      connect: rxMethod<{ userId: string; recordId: string }>((source) => {
        return source.pipe(map(({ userId, recordId }) => patchState(state, { userId, recordId })))
      }),
    }
  }),
  withComputed(({ userId, recordId }) => {
    const skills = inject(SkillBuildsService)
    const resource = rxResource({
      params: () => ({ userId: userId(), recordId: recordId() }),
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
  withComputed(({ record }) => {
    const backend = inject(BackendService)
    const sessionUserId = computed(() => backend.session()?.id)
    const isOurs = computed(() => {
      const recordUserId = record()?.userId || 'local'
      return recordUserId === 'local' || recordUserId === sessionUserId()
    })
    const isPublished = computed(() => record()?.status === 'public')
    const canImport = computed(() => !isOurs())
    const canEdit = computed(() => isOurs())
    const canShare = computed(() => isOurs() && !isPublished())
    return {
      canEdit,
      canImport,
      canShare,
      isPublished,
    }
  }),
  withMethods(({ record }) => {
    const service = inject(SkillBuildsService)

    return {
      create: service.create.bind(service),
      update: service.update.bind(service),
      delete: service.delete.bind(service),
      dublicate: service.dublicate.bind(service),
    }
  }),
)
