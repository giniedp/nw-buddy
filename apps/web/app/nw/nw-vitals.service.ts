import { Injectable } from '@angular/core'
import { Vitals } from '@nw-data/types'
import { combineLatest, defer, map } from 'rxjs'
import { NwDbService } from './nw-db.service'
import { LootBucketEntry, LootNode, LootTableEntry } from './utils'

const CREATURE_TYPE_MARKER = {
  Boss: 'boss',
  // Critter
  Dungeon: 'dungeon',
  'Dungeon+': 'dungeon', // TODO
  'Dungeon-': 'dungeonminus',
  DungeonBoss: 'boss',
  DungeonMiniBoss: 'groupplus',
  Elite: 'group',
  'Elite+': 'groupplus',
  'Elite-': 'groupminus',
  EliteBoss: 'boss',
  EliteMiniBoss: 'groupplus',
  // Player: '',
  'Named_Solo+': 'soloplus', // TODO
  Solo: 'solo',
  'Solo+': 'soloplus',
  'Solo-': 'solominus',
}

export type VitalDamageType =
  | 'Arcane'
  | 'Corruption'
  | 'Fire'
  | 'Ice'
  | 'Lightning'
  | 'Nature'
  | 'Siege'
  | 'Slash'
  | 'Standard'
  | 'Strike'
  | 'Thrust'
@Injectable({ providedIn: 'root' })
export class NwVitalsService {
  public index = defer(() => this.db.vitalsMap)

  public iconStronattack = 'assets/icons/strongattack.png'
  public iconWeakattack = 'assets/icons/weakattack.png'

  public constructor(private db: NwDbService) {}

  public creatureTypeicon(type: string) {
    const marker = CREATURE_TYPE_MARKER[type]
    return marker && `assets/icons/marker/marker_ai_level_bg_${marker}.png`
  }

  public vitalMarkerIcon(vital: Vitals) {
    return this.creatureTypeicon(vital?.CreatureType)
  }

  public damageEffectiveness(vital: Vitals, damageType: VitalDamageType) {
    return vital[`WKN${damageType}`] - vital[`ABS${damageType}`] || 0
  }

  public damageEffectivenessPercent(vital: Vitals, damageType: VitalDamageType) {
    return Math.round(this.damageEffectiveness(vital, damageType) * 100)
  }

  public vitalsThatCanDrop(itemIds: string[]) {
    return combineLatest({
      buckets: this.db.lootBuckets,
      tables: this.db.lootTables,
      vitals: this.db.vitals,
      graph: this.db.lootGraph
    }).pipe(
      map(({ buckets, tables, vitals, graph }) => {
        const leafs: LootNode[] = []
        LootNode.walk(graph, (node) => {
          if (node.itemId && itemIds.includes(node.itemId)) {
            leafs.push(node)
          }
        })
        const tableIds = leafs.map((it) => LootNode.getRoot(it).table.LootTableID)
        // console.log(graph, leafs)
        // const bucketIds = uniq(bucketsLeadingToItems(itemIds, buckets).map((it) => it.LootBucket))
        // const tableIds = [...tablesLeadingToItems(itemIds, tables), ...tablesLeadingToBuckets(bucketIds, tables)]
        //   .map((it) => lootTablePathTo(it, tables))
        //   .flat(1)
        //   .map((it) => it.LootTableID)
        //   console.log({
        //     itemIds,
        //     bucketIds,
        //     tableIds
        //   })
        return vitals.filter((it) => it.LootTableId && tableIds.includes(it.LootTableId))
      })
    )
  }
}

function bucketsLeadingToItems(itemIds: string[], buckets: LootBucketEntry[]) {
  return buckets.filter((it) => it.Item && itemIds.includes(it.Item))
}

function tablesLeadingToItems(itemIds: string[], tables: LootTableEntry[]) {
  return tables.filter((it) => it.Items?.some((i) => i.ItemID && itemIds.includes(i.ItemID)))
}

function tablesLeadingToBuckets(bucketIds: string[], tables: LootTableEntry[]) {
  return tables.filter((it) => it.Items?.some((i) => i.LootBucketID && bucketIds.includes(i.LootBucketID)))
}

function tablesLeadingToTables(tableIds: string[], tables: LootTableEntry[]) {
  return tables.filter((it) => it.Items?.some((i) => i.LootTableID && tableIds.includes(i.LootTableID)))
}

function lootTablePathTo(target: LootTableEntry, tables: LootTableEntry[]) {
  const result: LootTableEntry[] = []
  let parents: LootTableEntry[] = [target]
  while (parents.length) {
    result.push(...parents)
    parents = tablesLeadingToTables(
      parents.map((it) => it.LootTableID),
      tables
    ).filter((it) => {
      return result.every((res) => res.LootTableID !== it.LootTableID)
    })
  }
  return result
}

function buildTree({
  buckets,
  tables
}: {
  buckets: LootBucketEntry[],
  tables: LootTableEntry[]
}) {

}
