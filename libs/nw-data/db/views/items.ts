import { lootDroppedBy } from "../../common/loot-item-sources"
import { itemSalvagesTo as itemSalvagesToFn } from "../../common/loot-item-salvage"
import { NwDataSheets } from "../nw-data-sheets"

export async function itemLootSources(db: NwDataSheets, itemId: string) {
  return await lootDroppedBy(db, itemId)
}

export async function itemSalvagesTo(db: NwDataSheets, itemId: string) {
  return await itemSalvagesToFn(db, itemId)
}
