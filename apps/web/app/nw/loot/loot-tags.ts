import { GameModeData, MutationDifficultyStaticData, TerritoryDefinition } from '@nw-data/generated'
import { Observable, map, of } from 'rxjs'
import { mapFilter } from '~/utils'

export interface LootTagOption<T = unknown> {
  target: T
  targetId: string
  label: string
  tags: string[]
}

export function territoriesTags(source$: Observable<TerritoryDefinition[]>) {
  return source$.pipe(mapFilter((it) => !!it.LootTags?.length && !!it.NameLocalizationKey)).pipe(
    map((list) => {
      return [
        ...list.map((it): LootTagOption<TerritoryDefinition> => {
          return {
            target: it,
            targetId: String(it.TerritoryID),
            label: it.NameLocalizationKey,
            tags: it.LootTags,
          }
        }),
      ]
    }),
  )
}

export function poiTags(source$: Observable<TerritoryDefinition[]>) {
  return source$.pipe(mapFilter((it) => !!it.LootTags?.length && !!it.NameLocalizationKey)).pipe(
    map((list) => {
      return [
        ...list.map((it): LootTagOption<TerritoryDefinition> => {
          return {
            target: it,
            targetId: String(it.TerritoryID),
            label: it.NameLocalizationKey,
            tags: it.LootTags,
          }
        }),
      ]
    }),
  )
}

export function gameModesTags(source$: Observable<GameModeData[]>, mutated?: boolean) {
  return source$.pipe(mapFilter((it) => !!it.LootTags && !!it.DisplayName)).pipe(
    map((list) => {
      return [
        ...list.map((it): LootTagOption<GameModeData> => {
          return {
            target: it,
            targetId: String(it.GameModeId),
            label: it.DisplayName,
            tags: mutated ? it.MutLootTagsOverride || it.LootTags : it.LootTags,
          }
        }),
      ]
    }),
  )
}

export function mutaDifficultyTags(source$: Observable<MutationDifficultyStaticData[]>) {
  return source$.pipe(
    map((list) => {
      return [
        ...list.map((it): LootTagOption<MutationDifficultyStaticData> => {
          return {
            target: it,
            targetId: String(it.MutationDifficulty),
            label: `Mut ${it.MutationDifficulty}`,
            tags: it.InjectedLootTags,
          }
        }),
      ]
    }),
  )
}

export function mutaElementalTags() {
  return of(['Fire', 'Ice', 'Nature', 'Void']).pipe(
    map((list) => {
      return list.map((it): LootTagOption<string> => {
        return {
          target: it,
          targetId: it.substring(0, 3),
          label: `${it.substring(0, 3)}Title`,
          tags: [it],
        }
      })
    }),
  )
}
