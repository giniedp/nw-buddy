import { computed } from '@angular/core'
import { signalStore, withComputed, withState } from '@ngrx/signals'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { NwData } from '@nw-data/db'
import { CurseMutationStaticData, StatusEffectData } from '@nw-data/generated'
import { injectNwData, withStateLoader } from '~/data'

export interface MutaCurseDetailState {
  curseId: string
  curse: CurseMutationStaticData
  wildcard: string
  curseMajor: StatusEffectData
  curseMinor: StatusEffectData
}

export const MutaCurseDetailStore = signalStore(
  withState<MutaCurseDetailState>({
    curseId: null,
    curse: null,
    wildcard: null,
    curseMajor: null,
    curseMinor: null,
  }),
  withStateLoader(() => {
    const db = injectNwData()
    return {
      load: async ({ curseId, wildcard }: { curseId: string; wildcard: string }) => {
        const curse = await db.mutatorCursesById(curseId)
        const curseMajor = loadEffect(db, { curseId: curse.CurseMajor, wildcard })
        const curseMinor = loadEffect(db, { curseId: curse.CurseMinor, wildcard })
        return {
          curseId,
          curse,
          wildcard,
          curseMajor: await curseMajor,
          curseMinor: await curseMinor,
        }
      },
    }
  }),
  withComputed(({ curse, curseMajor, curseMinor }) => {
    return {
      icon: computed(() => curse()?.IconPath || NW_FALLBACK_ICON),
      name: computed(() => curse()?.Name),
      curses: computed(() => [curseMajor(), curseMinor()].filter((it) => !!it)),
    }
  }),
)

async function loadEffect(db: NwData, { curseId, wildcard }: { curseId: string; wildcard: string }) {
  if (!curseId || !wildcard) {
    return null
  }
  const effectId = curseId.replace('_Wildcard_', `_${wildcard}_`)
  return db.statusEffectsById(effectId)
}
