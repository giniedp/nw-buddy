import { computed, inject, Injector } from '@angular/core'
import { NW_MAX_CHARACTER_LEVEL, NW_MAX_TRADESKILL_LEVEL, NW_MAX_WEAPON_LEVEL } from '@nw-data/common'
import { combineLatest, map, NEVER, of, pipe, switchMap } from 'rxjs'
import { CaseInsensitiveMap } from '~/utils'

import { toObservable } from '@angular/core/rxjs-interop'
import { patchState, signalStore, withComputed, withHooks, withMethods, withProps, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { BackendService } from '../backend'
import { autoSync } from '../backend/auto-sync'
import { injectCharactersDB } from './characters.db'
import { CharacterRecord } from './types'

export interface CharacterStoreState {
  record: CharacterRecord
  ready: boolean
}

export type CharacterStore = InstanceType<typeof CharacterStore>
export const CharacterStore = signalStore(
  { providedIn: 'root' },
  withState<CharacterStoreState>({
    record: null,
    ready: false,
  }),
  withProps(({ record, ready }) => {
    const record$ = toObservable(record)
    const ready$ = toObservable(ready)
    return {
      record$,
      ready$,
    }
  }),
  withMethods((state) => {
    const backend = inject(BackendService)
    const userId = backend.sessionUserId
    const table = injectCharactersDB()
    return {
      create: (record: Partial<CharacterRecord>) => {
        return table.create({
          ...record,
          id: record.id ?? table.createId(),
          syncState: 'pending',
          createdAt: new Date().toJSON(),
          updatedAt: new Date().toJSON(),
          userId: userId() || 'local',
        })
      },
      update: (id: string, record: Partial<CharacterRecord>) => {
        return table.update(id, {
          ...record,
          id,
          syncState: 'pending',
          updatedAt: new Date().toJSON(),
          userId: userId() || 'local',
        })
      },
      destroy: (id: string) => {
        return table.destroy(id)
      },
    }
  }),
  withMethods((state) => {
    const backend = inject(BackendService)
    const userId = backend.sessionUserId
    const userId$ = toObservable(userId)
    const table = injectCharactersDB()
    return {
      load: rxMethod<string | void>(
        pipe(
          switchMap((characterId) => {
            return combineLatest({
              characterId: of(characterId),
              stage: autoSync({
                userId: userId$,
                local: table,
                remote: backend.privateTables.characters,
              }),
            })
          }),
          switchMap(({ stage, characterId }) => {
            const ready = stage === 'offline' || stage === 'syncing'
            patchState(state, { ready })
            if (!ready) {
              patchState(state, { record: null })
            }
            return ready ? of(characterId) : NEVER
          }),
          switchMap(async (id) => {
            const records = await table.where({ userId: userId() || 'local' })
            if (id && !records.some((it) => it.id === id)) {
              throw new Error(`Character with id ${id} not found`)
            }
            if (!id) {
              // first record
              id = records?.[0]?.id
            }
            if (!id) {
              // create default record
              const record = await state.create({})
              id = record.id
            }
            return id
          }),
          switchMap((id) => {
            return table.observeById(id)
          }),
          map((record) => {
            return patchState(state, { record })
          }),
        ),
      ),
    }
  }),
  withHooks({
    onInit: (state) => {
      state.load()
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
  withMethods(({ record, update, effectStacksMap, progressionMap }) => {
    const injector = inject(Injector)

    const clearEffects = () => {
      return update(record().id, { effectStacks: {} })
    }
    const clearProgression = () => {
      return update(record().id, { progressionLevels: {} })
    }

    const getProgressionLevel = (progressionId: string) => {
      return progressionMap().get(progressionId)
    }
    const setProgresssionLevel = (progressionId: string, level: number) => {
      update(record().id, {
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
      update(record().id, {
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
    const observeTradeskillLevel = (skill: string) => {
      return observeProgressionLevel(skill).pipe(map((level) => level ?? NW_MAX_TRADESKILL_LEVEL))
    }
    const observeWeaponLevel = (weapon: string) => {
      return observeProgressionLevel(weapon).pipe(map((level) => level ?? NW_MAX_WEAPON_LEVEL))
    }
    return {
      clearEffects,
      clearProgression,
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
      observeTradeskillLevel,
      observeWeaponLevel,
    }
  }),
)
