import { LoreData } from '@nw-data/generated'
import { eqCaseInsensitive } from '~/utils'

export interface LoreTree<T = unknown> {
  lore: LoreData
  meta?: T
  children: LoreTree<T>[]
}

export function selectLoreRoot(lore: LoreData, loreItems: LoreData[]) {
  while (lore?.ParentID) {
    lore = loreItems.find((it) => eqCaseInsensitive(it.LoreID, lore.ParentID))
  }
  return lore
}

export function selectLoreTree<T>(lore: LoreData, loreItems: LoreData[], meta?: (item: LoreData) => T): LoreTree {
  return {
    lore: lore,
    meta: meta?.(lore),
    children: !lore
      ? []
      : loreItems
          .filter((it) => eqCaseInsensitive(it.ParentID, lore.LoreID))
          .map((it) => selectLoreTree(it, loreItems, meta))
          .sort((a, b) => a.lore.Order - b.lore.Order),
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
