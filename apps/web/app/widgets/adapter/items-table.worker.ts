/// <reference lib="webworker" />
import { ItemDefinitionMaster, Perks } from '@nw-data/types'
import { expose } from 'comlink'
import { getItemPerkBucketIds, getItemPerks } from '~/nw/utils/item'
import { CaseInsensitiveMap } from '~/utils/caseinsensitive-map'

export type ItemsTableEntry = ItemDefinitionMaster & {
  $perks: Perks[]
  $perkBuckets: string[]
}

export interface ItemsTableTasks {
  transform: (args: { items: ItemDefinitionMaster[], perks: Map<string, Perks>}) => Promise<ItemsTableEntry[]>
}

const api: ItemsTableTasks = {
  transform: async ({ items, perks }) => {
    console.log(perks)
    perks = new CaseInsensitiveMap(perks)
    console.log(perks)
    return items.map((it): ItemsTableEntry => {
      return {
        ...it,
        $perks: getItemPerks(it, perks),
        $perkBuckets: getItemPerkBucketIds(it)
      }
    })
  }
}

expose(api)
