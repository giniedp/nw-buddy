import { LoreData } from '@nw-data/generated'
import { eqCaseInsensitive } from '~/utils'

export interface LoreTree {
  lore: LoreData
  children: LoreTree[]
}

export function selectLoreRoot(lore: LoreData, loreItems: LoreData[]) {
  while (lore?.ParentID) {
    lore = loreItems.find((it) => eqCaseInsensitive(it.LoreID, lore.ParentID))
  }
  return lore
}

export function selectLoreTree(lore: LoreData, loreItems: LoreData[]): LoreTree {
  return {
    lore: lore,
    children: !lore ? [] : loreItems
      .filter((it) => eqCaseInsensitive(it.ParentID, lore.LoreID))
      .map((it) => selectLoreTree(it, loreItems)),
  }
}

export function selectLoreList(tree: LoreTree, result: LoreData[] = []) {
  if (tree.lore) {
    result.push(tree.lore)
  }
  for (const child of tree.children) {
    selectLoreList(child, result)
  }
  return result
}
