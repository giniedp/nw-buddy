import { computed, inject, Injector } from '@angular/core'
import { NW_MAX_CHARACTER_LEVEL, NW_MAX_TRADESKILL_LEVEL, NW_MAX_WEAPON_LEVEL } from '@nw-data/common'
import { distinctUntilChanged, exhaustMap, filter, map, pipe, switchMap } from 'rxjs'
import { CaseInsensitiveMap, tapDebug } from '~/utils'

import { toObservable } from '@angular/core/rxjs-interop'
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { isEqual } from 'lodash'
import { CharactersDB } from './characters.db'
import { CharacterRecord } from './types'
import { migrateCharacter } from './migrations'

export interface CharacterStoreStateOLD {
  data: CharacterRecord
}

export type CharacterStore = InstanceType<typeof CharacterStore>
export const CharacterStore = signalStore(
  { providedIn: 'root' },
  withState<{ record: CharacterRecord }>({
    record: null,
  }),
  withMethods((state) => {
    const db = inject(CharactersDB)
    const record$ = toObservable(state.record)
    return {
      load: rxMethod<string | void>(
        pipe(
          switchMap((id) => (id ? db.observeByid(id) : db.observeCurrent())),
          map(migrateCharacter),
          // tapDebug('load'),
          distinctUntilChanged<CharacterRecord>(isEqual),
          map((record) => patchState(state, { record })),
        ),
      ),
      connectSync: rxMethod<void>(
        pipe(
          switchMap(() => record$),
          filter((it) => !!it),
          distinctUntilChanged<CharacterRecord>(isEqual),
          // tapDebug('sync back'),
          exhaustMap(async (record) => db.update(record.id, record).catch(console.error)),
        ),
      ),
    }
  }),
  withHooks({
    onInit: (state) => {
      state.load()
      state.connectSync()
    },
  }),
  withComputed(({ record }) => {
    return {
      name: computed(() => record()?.name),
      level: computed(() => record()?.level ?? NW_MAX_CHARACTER_LEVEL),
      progressionMap: computed(
        () => new CaseInsensitiveMap(Object.entries(record()?.progressionLevels || {})) as ReadonlyMap<string, number>,
      ),
      effectStacksMap: computed(
        () => new CaseInsensitiveMap(Object.entries(record()?.effectStacks || {})) as ReadonlyMap<string, number>,
      ),
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
