import { map, of } from "rxjs"
import { mapFilter } from "~/utils"
import { NwDbService } from "../nw-db.service"

export function territoriesTags(db: NwDbService) {
  return db.territories.pipe(mapFilter((it) => !!it.LootTags && !!it.NameLocalizationKey)).pipe(
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

export function poiTags(db: NwDbService) {
  return db.pois.pipe(mapFilter((it) => !!it.LootTags && !!it.NameLocalizationKey)).pipe(
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

export function gameModesTags(db: NwDbService, mutated?: boolean) {
  return db.gameModes.pipe(mapFilter((it) => !!it.LootTags && !!it.DisplayName)).pipe(
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

export function mutaDifficultyTags(db: NwDbService) {
  return db.mutatorDifficulties.pipe(
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

export function mutaElementalTags(db: NwDbService) {
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
