import { computed, inject } from '@angular/core'
import { NW_MAX_CHARACTER_LEVEL, NW_MAX_TRADESKILL_LEVEL, NW_MAX_WEAPON_LEVEL } from '@nw-data/common'
import { combineLatest, map, NEVER, Observable, of, pipe, switchMap } from 'rxjs'
import { CaseInsensitiveMap } from '~/utils'

import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { patchState, signalStore, withComputed, withHooks, withMethods, withProps, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { BackendService } from '../backend'
import { BookmarksService } from '../bookmarks/bookmarks.service'
import { BookmarkRecord } from '../bookmarks/types'
import { LOCAL_USER_ID } from '../constants'
import { injectNwData } from '../nw-data'
import { injectCharactersDB } from './characters.db'
import { CharactersService } from './characters.service'
import { CharacterRecord, TerritoryData } from './types'

export interface CharacterStoreState {
  record: CharacterRecord
}

export type CharacterStore = InstanceType<typeof CharacterStore>
export const CharacterStore = signalStore(
  { providedIn: 'root' },
  withState<CharacterStoreState>({
    record: null,
  }),
  withProps(({ record }) => {
    const record$ = toObservable(record)
    const table = injectCharactersDB()
    return {
      record$,
      table,
    }
  }),
  withMethods((state) => {
    const service = inject(CharactersService)
    const backend = inject(BackendService)
    const localUserId = computed(() => backend.sessionUserId() || LOCAL_USER_ID)
    const localUserId$ = toObservable(localUserId)
    return {
      load: rxMethod<string | void>(
        pipe(
          switchMap((characterId) => {
            return combineLatest({
              characterId: of(characterId),
              ready: service.ready$,
            })
          }),
          switchMap(({ characterId, ready }) => {
            if (!ready) {
              return NEVER
            }
            return combineLatest({
              userId: localUserId$,
              id: of(characterId),
            })
          }),
          switchMap(async ({ userId, id }) => {
            const records = await service.table.where({ userId })
            if (id && !records.some((it) => it.id === id)) {
              throw new Error(`Character with id ${id} not found`)
            }
            if (!id) {
              // least recently used
              id = records?.sort((a, b) => {
                const aUpdate = a.updatedAt
                const bUpdate = b.updatedAt
                return aUpdate < bUpdate ? 1 : -1
              })?.[0]?.id
            }
            if (!id) {
              // create default record
              const record = await service.create({})
              id = record.id
            }
            return { id, userId }
          }),
          switchMap(({ id, userId }) => {
            return service.observeRecord({ id, userId })
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
      isMale: computed(() => !record()?.gender || record()?.gender === 'male'),
      isFemale: computed(() => record()?.gender === 'female'),
      skin: computed(() => Number(record()?.skin) || 1),
      face: computed(() => Number(record()?.face) || 1),
      hairColor: computed(() => Number(record()?.hairColor) || 1),
      hairStyle: computed(() => Number(record()?.hairStyle) || 1),
      beardColor: computed(() => Number(record()?.beardColor) || 1),
      beardStyle: computed(() => Number(record()?.beardStyle) || 0),
      progressionMap: computed(() => {
        return new CaseInsensitiveMap(Object.entries(record()?.progressionLevels || {}))
      }),
      effectStacksMap: computed(() => {
        return new CaseInsensitiveMap(Object.entries(record()?.effectStacks || {}))
      }),
      territoriesMap: computed(() => {
        return new CaseInsensitiveMap(Object.entries(record()?.territories || {}))
      }),
    }
  }),
  withMethods(({ record, effectStacksMap, progressionMap, territoriesMap }) => {
    const service = inject(CharactersService)
    const progressionMap$ = toObservable(progressionMap)
    const territoriesMap$ = toObservable(territoriesMap)

    function update(data: Partial<CharacterRecord>) {
      return service.update(record().id, data)
    }
    function clearEffects() {
      return update({ effectStacks: {} })
    }
    function clearProgression() {
      return update({ progressionLevels: {} })
    }

    function getProgression(progressionId: string): number {
      return progressionMap().get(progressionId)
    }
    function setProgression(progressionId: string, value: number) {
      if (progressionId == null || progressionId === '') {
        return
      }
      update({
        progressionLevels: {
          ...(record().progressionLevels || {}),
          [progressionId]: value,
        },
      })
    }

    function getEffectStacks(effect: string) {
      return effectStacksMap().get(effect) || 0
    }
    function setEffectStacks(effect: string, stacks: number) {
      update({
        effectStacks: {
          ...(record().effectStacks || {}),
          [effect]: stacks,
        },
      })
    }

    function getTerritory(territoryId: number) {
      return territoriesMap().get(String(territoryId))
    }
    function setTerritory(progressionId: number, value: Partial<TerritoryData>) {
      if (progressionId == null) {
        return
      }
      const key = String(progressionId)
      update({
        territories: {
          ...(record().territories || {}),
          [key]: {
            ...(record().territories?.[key] || {}),
            ...value,
          },
        },
      })
    }

    function gameModeProgressionId(progressionId: string, difficulty: number) {
      return `${progressionId}:${difficulty}`
    }

    function observeProgression(progressionId: string): Observable<number> {
      return progressionMap$.pipe(map((map) => map.get(progressionId)))
    }
    function observeTradeskillLevel(skill: string): Observable<number> {
      return observeProgression(skill).pipe(map((level) => level ?? NW_MAX_TRADESKILL_LEVEL))
    }
    function observeWeaponLevel(weapon: string): Observable<number> {
      return observeProgression(weapon).pipe(map((level) => level ?? NW_MAX_WEAPON_LEVEL))
    }
    function observeGameModeProgression(progressionId: string, difficulty: number) {
      return observeProgression(gameModeProgressionId(progressionId, difficulty))
    }

    function observeTerritoryData(territoryId: number) {
      return territoriesMap$.pipe(map((map) => map.get(String(territoryId))))
    }

    return {
      update,
      clearEffects,
      getEffectStacks,
      setEffectStacks,

      clearProgression,
      getProgression,
      setProgression,

      getTradeskillLevel(skill: string) {
        return getProgression(skill) ?? NW_MAX_TRADESKILL_LEVEL
      },
      setTradeskillLevel(skill: string, level: number) {
        setProgression(skill, level)
      },
      getWeaponLevel(weapon: string) {
        return getProgression(weapon) ?? NW_MAX_WEAPON_LEVEL
      },
      setWeaponLevel(weapon: string, level: number) {
        setProgression(weapon, level)
      },
      getTerritoryData(territoryId: number) {
        return getTerritory(territoryId)
      },
      setTerritoryData(territoryId: number, update: Partial<TerritoryData>) {
        setTerritory(territoryId, update)
      },
      getGameModeProgression(progressionId: string, difficulty: number) {
        return getProgression(gameModeProgressionId(progressionId, difficulty))
      },
      setGameModeProgression(progressionId: string, difficulty: number, level: number) {
        setProgression(gameModeProgressionId(progressionId, difficulty), level)
      },

      observeTradeskillLevel,
      observeWeaponLevel,
      observeGameModeProgression,
      observeTerritoryData,
    }
  }),
  withMethods(({ record, observeTradeskillLevel }) => {
    const db = injectNwData()
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

      tradeskillLevelData: (skill: string | Observable<string>) => {
        if (!skill) {
          return of(null)
        }
        if (typeof skill === 'string') {
          skill = of(skill)
        }
        return skill.pipe(
          switchMap((skill) => {
            return combineLatest({
              skill: of(skill),
              level: observeTradeskillLevel(skill),
            })
          }),
          switchMap(({ skill, level }) => {
            return db.tradeskillRankDataByTradeskillAndLevel(skill, level)
          }),
        )
      },
    }
  }),
)
