import { lootDroppedBy } from "../../common/loot-item-sources"
import { NwDataSheets } from "../nw-data-sheets"

export async function itemLootSources(db: NwDataSheets, itemId: string) {
  return await lootDroppedBy(db, itemId)
}


