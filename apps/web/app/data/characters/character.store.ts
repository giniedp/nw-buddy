import { computed, inject, Injector } from '@angular/core'
import { NW_MAX_CHARACTER_LEVEL, NW_MAX_TRADESKILL_LEVEL, NW_MAX_WEAPON_LEVEL } from '@nw-data/common'
import { combineLatest, map, NEVER, of, pipe, switchMap } from 'rxjs'
import { CaseInsensitiveMap } from '~/utils'

import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { patchState, signalStore, withComputed, withHooks, withMethods, withProps, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { BackendService } from '../backend'
import { autoSync } from '../backend/auto-sync'
import { BookmarksService } from '../bookmarks/bookmarks.service'
import { BookmarkRecord } from '../bookmarks/types'
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
    const table = injectCharactersDB()
    return {
      record$,
      ready$,
      table,
    }
  }),
  withMethods(({ table }) => {
    const backend = inject(BackendService)
    const userId = backend.sessionUserId
    return {
      observeCount(userId: string) {
        userId ||= 'local'
        return table.observeWhereCount({ userId })
      },
      create(record: Partial<CharacterRecord>) {
        return table.create({
          ...record,
          id: record.id ?? table.createId(),
          syncState: 'pending',
          createdAt: new Date().toJSON(),
          updatedAt: new Date().toJSON(),
          userId: userId() || 'local',
        })
      },
      update(id: string, record: Partial<CharacterRecord>) {
        return table.update(id, {
          ...record,
          id,
          syncState: 'pending',
          updatedAt: new Date().toJSON(),
          userId: userId() || 'local',
        })
      },
      delete(id: string) {
        return table.delete(id)
      },
      async deleteUserData(userId: string) {
        const records = await table.where({ userId })
        return table.delete(records.map((it) => it.id))
      },
    }
  }),
  withMethods((state) => {
    const backend = inject(BackendService)
    const userId = backend.sessionUserId
    const userId$ = toObservable(userId)
    const table = injectCharactersDB()
    return {
      sync: rxMethod<void>((source) => {
        return source.pipe(
          switchMap(() => {
            return autoSync({
              userId: userId$,
              local: table,
              remote: backend.privateTables.characters,
            })
          }),
          map((stage) => {
            const ready = stage === 'offline' || stage === 'syncing'
            patchState(state, { ready })
          }),
        )
      }),
      load: rxMethod<string | void>(
        pipe(
          switchMap((characterId) => {
            return combineLatest({
              characterId: of(characterId),
              ready: state.ready$,
            })
          }),
          switchMap(({ characterId, ready }) => {
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
      state.sync()
      state.load()
    },
  }),
  withComputed(({ record }) => {
    return {
      name: computed(() => record()?.name),
      level: computed(() => record()?.level ?? NW_MAX_CHARACTER_LEVEL),
      progressionMap: computed(
        () => new CaseInsensitiveMap<string, number>(Object.entries(record()?.progressionLevels || {})),
      ),
      effectStacksMap: computed(
        () => new CaseInsensitiveMap<string, number>(Object.entries(record()?.effectStacks || {})),
      ),
    }
  }),
  withMethods(({ record, update, effectStacksMap, progressionMap }) => {
    const injector = inject(Injector)

    function clearEffects() {
      return update(record().id, { effectStacks: {} })
    }
    function clearProgression() {
      return update(record().id, { progressionLevels: {} })
    }

    function getProgressionLevel(progressionId: string) {
      return progressionMap().get(progressionId)
    }
    function setProgresssionLevel(progressionId: string, level: number) {
      update(record().id, {
        progressionLevels: {
          ...(record().progressionLevels || {}),
          [progressionId]: level,
        },
      })
    }

    function getEffectStacks(effect: string) {
      return effectStacksMap().get(effect) || 0
    }
    function setEffectStacks(effect: string, stacks: number) {
      update(record().id, {
        effectStacks: {
          ...(record().effectStacks || {}),
          [effect]: stacks,
        },
      })
    }

    function observeProgressionLevel(progressionId: string) {
      return toObservable(progressionMap, {
        injector,
      }).pipe(map((map) => map.get(progressionId)))
    }
    function observeTradeskillLevel(skill: string) {
      return observeProgressionLevel(skill).pipe(map((level) => level ?? NW_MAX_TRADESKILL_LEVEL))
    }
    function observeWeaponLevel(weapon: string) {
      return observeProgressionLevel(weapon).pipe(map((level) => level ?? NW_MAX_WEAPON_LEVEL))
    }
    return {
      clearEffects,
      getEffectStacks,
      setEffectStacks,

      clearProgression,
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
  withMethods(({ record }) => {
    const bookmarks = inject(BookmarksService)
    const userId = computed(() => record()?.userId || 'local')
    const characterId = computed(() => record()?.id || '')
    const userId$ = toObservable(userId)
    const characterId$ = toObservable(characterId)
    const bookRecords$ = combineLatest({
      userId: userId$,
      characterId: characterId$,
    }).pipe(
      switchMap(({ userId, characterId }) => {
        return bookmarks.observeRecords({ userId, characterId })
      }),
      map((bookRecords) => {
        const entries = (bookRecords || []).map((it) => {
          return [it.itemId, it] as const
        })
        return new CaseInsensitiveMap<string, BookmarkRecord>(entries)
      }),
    )
    const itemMap = toSignal(bookRecords$, {
      initialValue: new CaseInsensitiveMap<string, BookmarkRecord>(),
    })
    const itemMap$ = toObservable(itemMap)

    function getItemGearScore(itemId: string) {
      return itemMap().get(itemId)?.gearScore
    }
    function getItemMarker(itemId: string) {
      return itemMap().get(itemId)?.flags || 0
    }
    function observeItemGearScore(itemId: string) {
      return itemMap$.pipe(map((map) => map.get(itemId)?.gearScore))
    }
    function observeItemMarker(itemId: string) {
      return itemMap$.pipe(map((map) => map.get(itemId)?.flags || 0))
    }
    function updateItemTracking(itemId: string, tracker: Partial<Pick<BookmarkRecord, 'gearScore' | 'flags'>>) {
      itemId = itemId.toLowerCase()

      const record: BookmarkRecord = {
        id: null,
        userId: userId(),
        characterId: characterId(),
        itemId,
        ...(itemMap().get(itemId) || {}),
        ...tracker,
      }

      if (!record.gearScore && !record.flags) {
        return bookmarks.delete(record.id)
      }
      if (record.id) {
        return bookmarks.update(record.id, record)
      }
      return bookmarks.create(record)
    }
    function setItemGearScore(itemId: string, level: number) {
      updateItemTracking(itemId, { gearScore: level })
    }
    function setItemMarker(itemId: string, marker: number) {
      updateItemTracking(itemId, { flags: marker })
    }

    return {
      getItemGearScore,
      getItemMarker,
      setItemGearScore,
      setItemMarker,
      observeItemGearScore,
      observeItemMarker,
    }
  }),
)
