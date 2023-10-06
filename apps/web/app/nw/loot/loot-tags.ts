import { Gamemodes, Mutationdifficulty, PoiDefinition, Territorydefinitions } from '@nw-data/generated'
import { Observable, map, of } from 'rxjs'
import { mapFilter } from '~/utils'

export function territoriesTags(source$: Observable<Territorydefinitions[]>) {
  return source$.pipe(mapFilter((it) => !!it.LootTags?.length && !!it.NameLocalizationKey)).pipe(
    map((list) => {
      return [
        ...list.map((it) => {
          return {
            target: it,
            targetId: String(it.TerritoryID),
            label: it.NameLocalizationKey,
            tags: it.LootTags,
          }
        }),
      ]
    })
  )
}

export function poiTags(source$: Observable<PoiDefinition[]>) {
  return source$.pipe(mapFilter((it) => !!it.LootTags?.length && !!it.NameLocalizationKey)).pipe(
    map((list) => {
      return [
        ...list.map((it) => {
          return {
            target: it,
            targetId: String(it.TerritoryID),
            label: it.NameLocalizationKey,
            tags: it.LootTags,
          }
        }),
      ]
    })
  )
}

export function gameModesTags(source$: Observable<Gamemodes[]>, mutated?: boolean) {
  return source$.pipe(mapFilter((it) => !!it.LootTags && !!it.DisplayName)).pipe(
    map((list) => {
      return [
        ...list.map((it) => {
          return {
            target: it,
            targetId: String(it.GameModeId),
            label: it.DisplayName,
            tags: mutated ? it.MutLootTagsOverride || it.LootTags : it.LootTags,
          }
        }),
      ]
    })
  )
}

export function mutaDifficultyTags(source$: Observable<Mutationdifficulty[]>) {
  return source$.pipe(
    map((list) => {
      return [
        ...list.map((it) => {
          return {
            target: it,
            targetId: String(it.MutationDifficulty),
            label: `Mut ${it.MutationDifficulty}`,
            tags: it.InjectedLootTags,
          }
        }),
      ]
    })
  )
}

export function mutaElementalTags() {
  return of(['Fire', 'Ice', 'Nature', 'Void']).pipe(
    map((list) => {
      return list.map((it) => {
        return {
          target: it,
          targetId: it.substring(0, 3),
          label: `${it.substring(0, 3)}Title`,
          tags: [it],
        }
      })
    })
  )
}
