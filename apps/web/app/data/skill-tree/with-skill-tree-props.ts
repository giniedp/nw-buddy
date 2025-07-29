import { computed, inject, Signal } from '@angular/core'

import { BackendService } from '../backend'
import { LOCAL_USER_ID } from '../constants'
import { SkillTreeRecord } from './types'

export function skillTreeProps({ skillTree }: { skillTree: Signal<SkillTreeRecord> }) {
  const backend = inject(BackendService)
  const sessionUserId = computed(() => backend.session()?.id)
  const recordUserId = computed(() => skillTree()?.userId || LOCAL_USER_ID)
  const isOwned = computed(() => recordUserId() === LOCAL_USER_ID || recordUserId() === sessionUserId())
  const isPublished = computed(() => skillTree()?.status === 'public')
  return {
    isOwned,
    isEditable: computed(() => isOwned()),
    isReadonly: computed(() => !isOwned()),
    isImportable: computed(() => !isOwned()),
    isShareable: computed(() => isOwned() && !isPublished()),
    isPublished,
    isSyncable: computed(() => recordUserId() !== LOCAL_USER_ID),
    isSyncComplete: computed(() => skillTree()?.syncState === 'synced'),
    isSyncPending: computed(() => skillTree()?.syncState === 'pending'),
    isSyncConflict: computed(() => skillTree()?.syncState === 'conflict'),
  }
}
