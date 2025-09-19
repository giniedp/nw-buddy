import { uniq } from 'lodash'
import { GameModeData, GameModeMapData, MutationDifficultyStaticData, MutationPerksStaticData } from '../generated/types'

export function getGameModeLootTags(
  gameMode: GameModeData,
  mutation?: MutationDifficultyStaticData,
  element?: MutationPerksStaticData,
): string[] {
  if (!gameMode) {
    return []
  }
  if (!gameMode.IsMutable || !mutation) {
    return [...(gameMode.LootTags || [])]
  }
  const result = [
    ...(gameMode.MutLootTagsOverride || gameMode.LootTags || []),
    ...(mutation.InjectedLootTags || []),
    mutation.InjectedCreatureLoot || null,
    mutation.InjectedContainerLoot || null,
    element?.InjectedLootTags || null,
    element?.InjectedCreatureLoot || null,
    element?.InjectedContainerLoot || null,
  ].filter((it) => !!it)
  return uniq(result)
}

export function getGameModeCoatlicueDirectory(gameMap: GameModeMapData) {
  if (!gameMap?.CoatlicueName) {
    return null
  }
  // "coatlicue\\NewWorld_VitaeEterna" -> "NewWorld_VitaeEterna"
  return gameMap.CoatlicueName.split(/[\\/]/g).pop()
}
