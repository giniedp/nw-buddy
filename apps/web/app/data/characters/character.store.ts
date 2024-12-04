import { computed, DestroyRef, inject, Injector } from '@angular/core'
import { NW_MAX_CHARACTER_LEVEL, NW_MAX_TRADESKILL_LEVEL, NW_MAX_WEAPON_LEVEL } from '@nw-data/common'
import { distinctUntilChanged, exhaustMap, filter, map } from 'rxjs'
import { CaseInsensitiveMap } from '~/utils'

import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals'
import { isEqual } from 'lodash'
import { CharactersDB } from './characters.db'
import { CharacterRecord } from './types'

export interface CharacterStoreStateOLD {
  data: CharacterRecord
}

export interface CharacterStoreState {
  record: CharacterRecord
}

export type CharacterStore = InstanceType<typeof CharacterStore>
export const CharacterStore = signalStore(
  { providedIn: 'root' },
  withState<CharacterStoreState>({
    record: null,
  }),
  withMethods((state) => {
    const db = inject(CharactersDB)
    const dref = inject(DestroyRef)
    const record$ = toObservable(state.record)
    return {
      connectDB: () => {
        db.observeCurrent()
          .pipe(takeUntilDestroyed(dref))
          .subscribe((value) => {
            patchState(state, { record: value })
          })

        record$
          .pipe(
            filter((it) => !!it),
            distinctUntilChanged<CharacterRecord>(isEqual),
            exhaustMap(async (record) => db.update(record.id, record).catch(console.error)),
            takeUntilDestroyed(dref),
          )
          .subscribe()
      },
    }
  }),
  withHooks({
    onInit: (state) => {
      state.connectDB()
    },
  }),
  withComputed(({ record }) => {
    return {
      name: computed(() => record()?.name),
      level: computed(() => record()?.level ?? NW_MAX_CHARACTER_LEVEL),
      progressionMap: computed(() => new CaseInsensitiveMap(Object.entries(record()?.progressionLevels || {})) as ReadonlyMap<string, number>),
      effectStacksMap: computed(() => new CaseInsensitiveMap(Object.entries(record()?.effectStacks || {})) as ReadonlyMap<string, number>),
    }
  }),
  withMethods((state) => {
    const patchRecord = (patch: Partial<CharacterRecord>) => {
      patchState(state, ({ record }) => {
        return {
          record: {
            ...record,
            ...patch,
          },
        }
      })
    }
    return {
      patchRecord,
      clearEffects: () => patchRecord({ effectStacks: {} }),
      clearProgression: () => patchRecord({ progressionLevels: {} }),
    }
  }),
  withMethods(({ record, patchRecord, effectStacksMap, progressionMap }) => {
    const injector = inject(Injector)

    const getProgressionLevel = (progressionId: string) => {
      return progressionMap().get(progressionId)
    }
    const setProgresssionLevel = (progressionId: string, level: number) => {
      patchRecord({
        progressionLevels: {
          ...(record().progressionLevels || {}),
          [progressionId]: level,
        },
      })
    }

    const getEffectStacks = (effect: string) => {
      return effectStacksMap().get(effect) || 0
    }
    const setEffectStacks = (effect: string, stacks: number) => {
      patchRecord({
        effectStacks: {
          ...(record().effectStacks || {}),
          [effect]: stacks,
        },
      })
    }
    const observeProgressionLevel = (progressionId: string) => {
      return toObservable(progressionMap, {
        injector,
      }).pipe(map((map) => map.get(progressionId)))
    }
    return {
      getEffectStacks,
      setEffectStacks,
      getProgressionLevel,
      setProgresssionLevel,
      getTradeskillLevel(skill: string) {
        return getProgressionLevel(skill) ?? NW_MAX_TRADESKILL_LEVEL
      },
      setTradeskillLevel(skill: string, level: number) {
        setProgresssionLevel(skill, level)
      },
      getWeaponLevel(weapon: string) {
        return getProgressionLevel(weapon) ?? NW_MAX_WEAPON_LEVEL
      },
      setWeaponLevel(weapon: string, level: number) {
        setProgresssionLevel(weapon, level)
      },
      observeProgressionLevel,
    }
  }),
)
