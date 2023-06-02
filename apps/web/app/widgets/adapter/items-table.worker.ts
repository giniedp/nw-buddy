/// <reference lib="webworker" />
import { getItemPerkBucketIds, getItemPerks } from '@nw-data/common'
import { ItemDefinitionMaster, Perks } from '@nw-data/generated'
import { expose } from 'comlink'
import { CaseInsensitiveMap } from '~/utils/caseinsensitive-map'

export type ItemsTableEntry = ItemDefinitionMaster & {
  $perks: Perks[]
  $perkBuckets: string[]
}

export interface ItemsTableTasks {
  transform: (args: { items: ItemDefinitionMaster[]; perks: Map<string, Perks> }) => Promise<ItemsTableEntry[]>
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
        $perkBuckets: getItemPerkBucketIds(it),
      }
    })
  },
}

expose(api)
