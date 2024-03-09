import { uniq } from 'lodash'
import { Elementalmutationperks, Gamemodes, Mutationdifficulty } from '../generated/types'

export function getGameModeLootTags(
  gameMode: Gamemodes,
  mutation?: Mutationdifficulty,
  element?: Elementalmutationperks,
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
    ...(element?.InjectedLootTags || []),
    element?.InjectedCreatureLoot || null,
    element?.InjectedContainerLoot || null,
  ].filter((it) => !!it)
  return uniq(result)
}
