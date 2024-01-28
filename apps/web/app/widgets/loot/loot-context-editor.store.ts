import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { NW_MAX_CHARACTER_LEVEL, NW_MAX_ENEMY_LEVEL, getVitalDungeons, getVitalFamilyInfo } from '@nw-data/common'
import { Gamemodes, Mutationdifficulty, PoiDefinition } from '@nw-data/generated'
import { sortBy } from 'lodash'
import { Observable, combineLatest, filter, map, of, switchMap, tap } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDataService } from '~/data'
import { gameModesTags, mutaDifficultyTags, mutaElementalTags, poiTags, territoriesTags } from '~/nw/loot/loot-tags'

export interface LootTagOption<T = unknown> {
  label: string
  target: T
  targetId: string
  tags: string[]
}

export interface LootContextEditorState {
  isLoaded?: boolean
  isMutation?: boolean

  playerLevel?: number
  minContLevel?: number
  minPoiLevel?: number
  enemyLevel?: number

  vitalId?: string

  territoryId?: number
  territoryOptions?: LootTagOption[]

  poiId?: number
  poiOptions?: LootTagOption[]

  gameModeId?: string
  gameModeOptions?: LootTagOption<Gamemodes>[]
  gameModeOptionsMuta?: LootTagOption<Gamemodes>[]

  mutaDifficulty?: string
  mutaDifficultyOptions?: LootTagOption<Mutationdifficulty>[]

  mutaElement?: string
  mutaElementOptions?: LootTagOption[]
}

@Injectable()
export class LootContextEditorStore extends ComponentStore<LootContextEditorState> {
  public readonly isMutable$ = this.select(
    ({ gameModeId, gameModeOptions }) => gameModeOptions?.find((it) => it.targetId === gameModeId)?.target?.IsMutable
  )
  public readonly isMutation$ = this.isMutable$.pipe(
    switchMap((isMutable) => this.select(({ isMutation }) => !!isMutable && !!isMutation))
  )
  public readonly playerLevel$ = this.select(({ playerLevel }) => playerLevel)
  public readonly minContLevel$ = this.select(({ minContLevel }) => minContLevel)
  public readonly minPoiLevel$ = this.select(({ minPoiLevel }) => minPoiLevel)
  public readonly enemyLevel$ = this.select(({ enemyLevel }) => enemyLevel)
  public readonly vitalId$ = this.select(({ vitalId }) => vitalId)
  public readonly vital$ = this.select(this.db.vital(this.vitalId$), (it) => {
    return {
      item: it,
      selection: it?.VitalsID,
      name: it?.DisplayName,
      icon: getVitalFamilyInfo(it)?.Icon,
      tags: it?.LootTags,
    }
  })

  public readonly territoryId$ = this.select(({ territoryId }) => territoryId)
  public readonly territory$ = this.select(this.db.territory(this.territoryId$), (selection) => {
    return {
      selection: selection?.TerritoryID,
      name: selection?.NameLocalizationKey,
      tags: selection?.LootTags || [],
    }
  })

  public readonly poiId$ = this.select(({ poiId }) => poiId)
  public readonly poi$ = this.select(this.db.poi(this.poiId$), (selection) => {
    return {
      selection: selection?.TerritoryID,
      name: selection?.NameLocalizationKey,
      icon: selection?.MapIcon || selection?.CompassIcon,
      tags: selection?.LootTags,
    }
  })

  public readonly gameModeId$ = this.select(({ gameModeId }) => gameModeId)
  public readonly gameMode$ = this.select(
    this.db.gameMode(this.gameModeId$),
    this.isMutation$,
    (selection, isMutation) => {
      return {
        selection: selection?.GameModeId,
        name: selection?.DisplayName,
        icon: selection?.IconPath,
        isMutable: !!selection?.IsMutable,
        isMutation: isMutation,
        tags: isMutation ? selection?.MutLootTagsOverride || selection?.LootTags : selection?.LootTags,
      }
    }
  )

  public readonly mutaDifficulty$ = this.select(
    this.state$,
    this.isMutation$,
    ({ mutaDifficulty, mutaDifficultyOptions }, isMutation) => {
      if (!isMutation) {
        return null
      }
      const selection = mutaDifficultyOptions?.find((it) => it.targetId === mutaDifficulty)
      return {
        selection: mutaDifficulty,
        options: mutaDifficultyOptions,
        name: selection?.label,
        tags: selection?.tags,
      }
    }
  )

  public readonly mutaElement$ = this.select(
    this.state$,
    this.isMutation$,
    ({ mutaElement, mutaElementOptions }, isMutation) => {
      if (!isMutation) {
        return null
      }
      return {
        selection: mutaElement,
        options: mutaElementOptions,
        tags: mutaElementOptions?.find((it) => it.targetId === mutaElement)?.tags,
      }
    }
  )

  public readonly context$ = combineLatest({
    playerLevel: this.playerLevel$,
    minContLevel: this.minContLevel$,
    minPoiLevel: this.minPoiLevel$,
    enemyLevel: this.enemyLevel$,

    poi: this.poi$,
    vital: this.vital$,
    territory: this.territory$,

    gameMode: this.gameMode$,
    mutaDifficulty: this.mutaDifficulty$,
    mutaElement: this.mutaElement$,
  }).pipe(
    map((data) => {
      const tags: string[] = [
        'GlobalMod',
        ...(data.territory?.tags || []),
        ...(data.poi?.tags || []),
        ...(data.gameMode?.tags || []),
        ...(data.mutaDifficulty?.tags || []),
        ...(data.mutaElement?.tags || []),
        ...(data.vital?.tags || []),
      ]
      const values: Record<string, string | number> = {}
      if (data.playerLevel != null) {
        values['Level'] = Math.max(data.playerLevel - 1, 0)
      }
      if (data.enemyLevel != null) {
        values['EnemyLevel'] = Math.max(data.enemyLevel - 1, 0)
      }
      if (data.minContLevel != null) {
        values['MinContLevel'] = data.minContLevel
      }
      if (data.minPoiLevel != null) {
        values['MinPOIContLevel'] = data.minPoiLevel
      }
      return {
        tags: tags,
        values: values,
      }
    })
  )

  public constructor(private db: NwDataService, private tl8: TranslateService) {
    super({
      playerLevel: NW_MAX_CHARACTER_LEVEL,
    })
  }

  public readonly load = this.effect<void>(() => {
    return combineLatest({
      poi: poiTags(this.db.pois).pipe(switchMap((it) => sortedTagOptions(it, this.tl8))),
      territories: territoriesTags(this.db.territories).pipe(switchMap((it) => sortedTagOptions(it, this.tl8))),
      gameModes: gameModesTags(this.db.gameModes, false).pipe(switchMap((it) => sortedTagOptions(it, this.tl8))),
      gameModesMuta: gameModesTags(this.db.gameModes, true).pipe(switchMap((it) => sortedTagOptions(it, this.tl8))),
      mutaElements: mutaElementalTags().pipe(switchMap((it) => sortedTagOptions(it, this.tl8))),
      mutaDifficulties: mutaDifficultyTags(this.db.mutatorDifficulties).pipe(
        switchMap((it) => sortedTagOptions(it, this.tl8))
      ),
    }).pipe(
      map((data) => {
        this.patchState({
          poiOptions: data.poi,
          territoryOptions: data.territories,
          gameModeOptions: data.gameModes,
          gameModeOptionsMuta: data.gameModesMuta,
          mutaDifficultyOptions: data.mutaDifficulties,
          mutaElementOptions: data.mutaElements,
          isLoaded: true,
        })
      })
    )
  })

  public readonly loadEnemyLevelAndGameMode = this.effect<void>(() => {
    return combineLatest({
      vital: this.db.vital(this.vitalId$),
      meta: this.db.vitalsMetadataMap,
      modes: this.db.gameModes,
    })
      .pipe(filter(({ vital }) => !!vital))
      .pipe(
        map(({ vital, modes, meta }) => {
          const dungeon = getVitalDungeons(vital, modes, meta)?.[0]
          if (!dungeon) {
            this.patchState({ enemyLevel: vital.Level })
            return
          }
          if (dungeon.IsMutable && this.get(({ isMutation }) => isMutation)) {
            this.patchState({
              enemyLevel: NW_MAX_ENEMY_LEVEL,
              gameModeId: dungeon.GameModeId,
            })
            return
          }
          this.patchState({
            enemyLevel: vital.Level,
            gameModeId: dungeon.GameModeId,
          })
        })
      )
  })

  public readonly loadMinPoiLevel = this.effect<void>(() => {
    return this.db.poi(this.poiId$).pipe(map((poi) => this.patchState({ minPoiLevel: getMinPoiLevel(poi) })))
  })

  public readonly loadContentLevel = this.effect<void>(() => {
    return combineLatest({
      vital: this.db.vital(this.vitalId$),
      territory: this.db.territory(this.territoryId$),
      gameMode: this.db.gameMode(this.gameModeId$),
      isMutation: this.isMutation$,
    }).pipe(
      map(({ vital, territory, gameMode, isMutation }) => {
        if (gameMode) {
          this.patchState({
            minContLevel: isMutation ? NW_MAX_ENEMY_LEVEL : gameMode.ContainerLevel || gameMode.RequiredLevel,
          })
        } else if (territory) {
          this.patchState({
            minContLevel: territory.RecommendedLevel,
          })
        } else if (vital) {
          this.patchState({
            minContLevel: vital.Level,
          })
        }
      })
    )
  })

  public readonly loadTerritory = this.effect<void>(() => {
    return combineLatest({
      gameMode: this.db.gameMode(this.gameModeId$),
      isMutation: this.isMutation$,
    })
  })
}

function getMinPoiLevel(poi: PoiDefinition) {
  if (!poi?.LevelRange) {
    return null
  }
  if (typeof poi.LevelRange === 'number') {
    return poi.LevelRange
  }
  return poi.LevelRange.split('-').map((it) => Number(it))[0]
}
function sortedTagOptions<T extends LootTagOption>(tags: Array<T>, tl8: TranslateService) {
  if (!tags?.length) {
    return of<T[]>([])
  }
  return combineLatest(
    tags.map((it) => {
      return tl8.observe(it.label).pipe(
        map((label): T => {
          return {
            ...it,
            label: label,
          }
        })
      )
    })
  ).pipe(map((list) => sortBy(list, (it) => it.label)))
}
