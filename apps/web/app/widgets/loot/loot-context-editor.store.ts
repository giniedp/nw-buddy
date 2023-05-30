import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { Gamemodes, Mutationdifficulty } from '@nw-data/generated'
import { combineLatest, map, of, switchMap } from 'rxjs'
import { NwDbService } from '~/nw'
import { gameModesTags, mutaDifficultyTags, mutaElementalTags, poiTags, territoriesTags } from '~/nw/loot/loot-tags'
import { NW_MAX_CHARACTER_LEVEL } from '~/nw/utils/constants'

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
  contentLevel?: number

  vitalId?: string

  territoryId?: string
  territoryOptions?: LootTagOption[]

  poiId?: string
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
  public readonly contentLevel$ = this.select(({ contentLevel }) => contentLevel)
  public readonly vital$ = this.select(({ vitalId }) => vitalId).pipe(
    switchMap((id) => (id ? this.db.vital(id) : of(null)))
  )

  public readonly territory$ = this.select(({ territoryId, territoryOptions }) => ({
    selection: territoryId,
    options: territoryOptions,
    tags: territoryOptions?.find((it) => it.targetId === territoryId)?.tags,
  }))

  public readonly poi$ = this.select(({ poiId, poiOptions }) => ({
    selection: poiId,
    options: poiOptions,
    tags: poiOptions?.find((it) => it.targetId === poiId)?.tags,
  }))

  public readonly gameMode$ = this.isMutation$.pipe(
    switchMap((isMutation) => {
      return this.select(({ gameModeId, gameModeOptions, gameModeOptionsMuta }) => {
        const options = isMutation ? gameModeOptionsMuta : gameModeOptions
        return {
          selection: gameModeId,
          options: options,
          tags: options?.find((it) => it.targetId === gameModeId)?.tags,
        }
      })
    })
  )

  public readonly mutaDifficulty$ = this.isMutation$.pipe(
    switchMap((it) => {
      return !it
        ? of(null)
        : this.select(({ mutaDifficulty, mutaDifficultyOptions }) => {
            return {
              selection: mutaDifficulty,
              options: mutaDifficultyOptions,
              tags: mutaDifficultyOptions?.find((it) => it.targetId === mutaDifficulty)?.tags,
            }
          })
    })
  )

  public readonly mutaElement$ = this.isMutation$.pipe(
    switchMap((it) => {
      return !it
        ? of(null)
        : this.select(({ mutaElement, mutaElementOptions }) => {
            return {
              selection: mutaElement,
              options: mutaElementOptions,
              tags: mutaElementOptions?.find((it) => it.targetId === mutaElement)?.tags,
            }
          })
    })
  )

  public readonly context$ = combineLatest({
    vital: this.vital$,
    territory: this.territory$,
    poi: this.poi$,
    gameMode: this.gameMode$,
    mutaDifficulty: this.mutaDifficulty$,
    mutaElement: this.mutaElement$,
    playerLevel: this.select(({ playerLevel }) => playerLevel),
    contentLevel: this.select(({ contentLevel }) => contentLevel),
  }).pipe(
    map((data) => {
      const tags: string[] = [
        'GlobalMod',
        ...(data.territory?.tags || []),
        ...(data.poi?.tags || []),
        ...(data.gameMode?.tags || []),
        ...(data.mutaDifficulty?.tags || []),
        ...(data.mutaElement?.tags || []),
        ...(data.vital?.LootTags || []),
      ]
      const values: Record<string, string | number> = {}
      if (data.playerLevel != null) {
        values['Level'] = data.playerLevel
      }
      if (data.vital != null) {
        values['EnemyLevel'] = data.vital.Level
      }
      if (data.contentLevel != null) {
        values['MinContLevel'] = data.contentLevel
      }
      return {
        tags: tags,
        values: values,
      }
    })
  )

  public constructor(private db: NwDbService) {
    super({
      playerLevel: NW_MAX_CHARACTER_LEVEL,
    })
  }

  public readonly load = this.effect<void>(() => {
    return combineLatest({
      poi: poiTags(this.db.pois),
      territories: territoriesTags(this.db.territories),
      gameModes: gameModesTags(this.db.gameModes, false),
      gameModesMuta: gameModesTags(this.db.gameModes, true),
      mutaElements: mutaElementalTags(),
      mutaDifficulties: mutaDifficultyTags(this.db.mutatorDifficulties),
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
}
