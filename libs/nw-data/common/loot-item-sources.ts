import { uniqBy } from 'lodash'
import type { NwDataSheets } from '../db/nw-data-sheets'
import type {
  GameModeData,
  HouseItems,
  MasterItemDefinitions,
  MutationDifficultyStaticData,
  MutationPerksStaticData,
  ScannedVitalSpawn,
  TerritoryDefinition,
  VitalsBaseData,
} from '../generated'
import {
  NW_LOOT_GlobalMod,
  NW_LTID_CreatureLootMaster_MutatedContainer,
  NW_MAP_NEWWORLD_VITAEETERNA,
  NW_MAX_ENEMY_LEVEL,
} from './constants'
import { getGameModeCoatlicueDirectory } from './game-mode'
import { getItemRarityNumeric, isItemLootContainer, isMasterItem } from './item'
import {
  getItemLootRoots,
  isLootTagKnownCondition,
  LootConditionTag,
  LootConditionValue,
  LootNode,
  parseLootRef,
  parseLootTag,
} from './loot'
import {
  canAccessLootBucketRow,
  canAccessLootTable,
  canAccessLootTableRow,
  getItemSalvageInfo,
  lootContext,
  type LootContext,
} from './loot-context'
import { eqCaseInsensitive } from './utils/caseinsensitive-compare'
import { CaseInsensitiveMap } from './utils/caseinsensitive-map'
import { getVitalGameModeMaps } from './vitals'

export async function lootDroppedBy(db: NwDataSheets, itemId: string) {
  const roots = await getItemLootRoots(db, itemId)
  if (!roots.length) {
    return null
  }

  const mutDifficulties = await db.mutatorDifficultiesAll()
  const mutElements = await db.mutatorElementsPerksAll()
  const mutTags = new Set([
    ...mutDifficulties.map((it) => it.InjectedLootTags || []).flat(),
    ...mutElements.map((it) => it.InjectedLootTags || []).flat(),
  ])

  const tables = roots.map((it) => (it.table ? it.table.LootTableID : null)).filter((it) => !!it)
  const vitals = await buildVitalsWithContext(db, tables)
  const droppedBy = resolveDroppedByVitals(roots, vitals, mutTags)

  const items = await buildItemsWithContext(db, tables)
  const salvagedFrom = resolveSalvageFrom(roots, items, mutTags)

  return {
    droppedBy,
    salvagedFrom,
  }
}

interface VitalWithContext {
  id: string
  vital: VitalsBaseData
  spawn: ScannedVitalSpawn
  tables: string[]
  context: LootContext
}

async function buildVitalsWithContext(db: NwDataSheets, tables: string[]): Promise<VitalWithContext[]> {
  const gameMaps = await db.gameModesMapsAll()
  const gameModes = await db.gameModesByIdMap()
  const mutDifficulties = await db.mutatorDifficultiesAll()
  const mutElements = await db.mutatorElementsPerksAll()
  const vitals = await db.vitalsAll()
  const vitalMetaMap = await db.vitalsMetadataByIdMap()
  const poiMap = await db.territoriesByIdMap()

  const result: VitalWithContext[] = []
  for (const vital of vitals) {
    const meta = vitalMetaMap.get(vital.VitalsID)
    if (!meta?.spawns) {
      continue
    }
    const vitalMaps = getVitalGameModeMaps(vital, gameMaps, vitalMetaMap)
    for (const gameMap of vitalMaps) {
      const gameMode = gameModes.get(gameMap.GameModeId)
      const coatlicueDir = getGameModeCoatlicueDirectory(gameMap).toLowerCase()
      const spawns = meta.spawns[coatlicueDir] || []
      const lootTables = [vital.LootTableId]
      if (gameMode.IsMutable) {
        lootTables.push(NW_LTID_CreatureLootMaster_MutatedContainer)
        for (const it of mutElements) {
          if (it.InjectedCreatureLoot) {
            lootTables.push(it.InjectedCreatureLoot)
          }
        }
        for (const it of mutDifficulties) {
          if (it.InjectedCreatureLoot) {
            lootTables.push(it.InjectedCreatureLoot)
          }
        }
      }
      if (!lootTables.some((table1) => tables.some((table2) => eqCaseInsensitive(table1, table2)))) {
        continue
      }
      for (const spawn of spawns) {
        result.push({
          id: vital.VitalsID,
          vital,
          spawn,
          tables: lootTables,
          context: buildVitalLootContext({
            vital,
            spawn,
            gameMode,
            mutDifficulties,
            mutElements,
            poiMap,
          }),
        })
      }
    }
    if (!tables.some((table) => eqCaseInsensitive(table, vital.LootTableId))) {
      continue
    }

    const worldSpawns = meta.spawns[NW_MAP_NEWWORLD_VITAEETERNA] || []
    for (const spawn of worldSpawns) {
      result.push({
        id: vital.VitalsID,
        vital,
        spawn,
        tables: [vital.LootTableId],
        context: buildVitalLootContext({
          vital,
          spawn,
          gameMode: null,
          mutDifficulties: null,
          mutElements: null,
          poiMap,
        }),
      })
    }
  }
  return result
}

function buildVitalLootContext({
  vital,
  spawn,
  gameMode,
  poiMap,
  mutDifficulties,
  mutElements,
}: {
  vital: VitalsBaseData
  spawn: ScannedVitalSpawn
  gameMode: GameModeData
  poiMap: Map<number, TerritoryDefinition>
  mutDifficulties: MutationDifficultyStaticData[]
  mutElements: MutationPerksStaticData[]
}) {
  const tags: string[] = [NW_LOOT_GlobalMod]

  if (vital.LootTags?.length) {
    tags.push(...vital.LootTags)
  }

  for (const poiID of spawn.t) {
    const poi = poiMap.get(poiID)
    if (poi?.LootTags?.length) {
      tags.push(...poi.LootTags)
    }
  }

  const levels = [...spawn.l]
  if (gameMode) {
    if (Array.isArray(gameMode.LootTags)) {
      tags.push(...gameMode.LootTags)
    }
    if (gameMode.IsMutable) {
      levels.push(NW_MAX_ENEMY_LEVEL)
      if (Array.isArray(gameMode.MutLootTagsOverride)) {
        tags.push(...gameMode.MutLootTagsOverride)
      }
      for (const dif of mutDifficulties) {
        if (Array.isArray(dif.InjectedLootTags)) {
          tags.push(...dif.InjectedLootTags)
        }
      }
      for (const elm of mutElements) {
        if (elm.InjectedLootTags) {
          tags.push(...elm.InjectedLootTags)
        }
      }
    }
  }

  return lootContext(tags, {
    Level: '*',
    EnemyLevel: levels,
    MinContLevel: levels,
    MinPOIContLevel: levels,
    MinEnemyContLevel: levels,
  })
}

function doesVitalDropLoot(vital: VitalWithContext, loot: LootNode) {
  // const doDebug = eqCaseInsensitive(vital.vital.VitalsID, 'anubianguardian_brute_boss')
  if (!vital.tables.length || !loot.table) {
    return false
  }
  if (!vital.tables.some((it) => eqCaseInsensitive(it, loot.table.LootTableID))) {
    return false
  }
  let node = loot
  while (node) {
    if (node.table && !canAccessLootTableRow(vital.context, node.table, node.row)) {
      return false
    }
    if (node.bucket && !canAccessLootBucketRow(vital.context, node.bucket)) {
      return false
    }
    node = node.next
  }
  return true
}

export interface DroppedByRow {
  vitalsID: string
  variations: ConditionDescription[]
}

function resolveDroppedByVitals(roots: LootNode[], vitals: VitalWithContext[], tagsToKeep: Set<string>) {
  const collection = new CaseInsensitiveMap<string, Set<LootNode>>()
  for (const source of roots) {
    for (const it of vitals) {
      if (collection.get(it.id)?.has(source)) {
        continue
      }
      if (!doesVitalDropLoot(it, source)) {
        continue
      }
      if (!collection.has(it.id)) {
        collection.set(it.id, new Set())
      }
      collection.get(it.id).add(source)
    }
  }

  const result: DroppedByRow[] = []
  collection.forEach((sources, id) => {
    const row: DroppedByRow = {
      vitalsID: id,
      variations: [],
    }
    result.push(row)
    for (const source of sources) {
      row.variations.push(describeConditions(source, tagsToKeep))
    }
  })

  for (const row of result) {
    row.variations = uniqBy(row.variations, (it) => {
      return it.conditions.map((c) => `${c.tag}:${c.value}`).join(',') + ',' + it.tags.join(',')
    })
  }
  return result
}

interface ItemWithContext {
  id: string
  item: MasterItemDefinitions | HouseItems
  table: string
  isContainer: boolean
  context: LootContext
}

async function buildItemsWithContext(db: NwDataSheets, tables: string[]): Promise<ItemWithContext[]> {
  const result: ItemWithContext[] = []
  const items = await db.itemsAll()
  for (const item of items) {
    const ref = parseLootRef(item.RepairRecipe)
    if (!ref || ref.prefix !== 'LTID') {
      continue
    }
    const salvageTable = ref.name
    if (!tables.some((it) => eqCaseInsensitive(it, salvageTable))) {
      continue
    }
    const context = getItemSalvageInfo(item, '*', '*')
    if (!context) {
      continue
    }
    result.push({
      id: item.ItemID,
      item,
      table: salvageTable,
      context: lootContext([...context.tags, salvageTable], context.values),
      isContainer: isItemLootContainer(item),
    })
  }
  const houseItems = await db.housingItemsAll()
  for (const item of houseItems) {
    const ref = parseLootRef(item.RepairRecipe)
    if (!ref || ref.prefix !== 'LTID') {
      continue
    }
    const salvageTable = ref.name
    if (!tables.some((it) => eqCaseInsensitive(it, salvageTable))) {
      continue
    }
    const context = getItemSalvageInfo(item, '*', '*')
    if (!context) {
      continue
    }
    result.push({
      id: item.HouseItemID,
      item,
      table: salvageTable,
      context: lootContext([...context.tags, salvageTable], context.values),
      isContainer: false,
    })
  }
  return result
}

function doesItemDropLoot(item: ItemWithContext, loot: LootNode) {
  if (!item.table || !loot.table) {
    return false
  }
  if (!eqCaseInsensitive(item.table, loot.table.LootTableID)) {
    return false
  }
  while (loot) {
    if (loot.table && !canAccessLootTable(item.context, loot.table)) {
      return false
    }
    if (loot.bucket && !canAccessLootBucketRow(item.context, loot.bucket)) {
      return false
    }
    loot = loot.next
  }
  return true
}

export interface SalvagedFrom {
  itemId: string
  variations: ConditionDescription[]
}

function resolveSalvageFrom(roots: LootNode[], items: ItemWithContext[], tagsToKeep: Set<string>) {
  const collection = new CaseInsensitiveMap<string, Set<LootNode>>()
  for (const source of roots) {
    for (const item of items) {
      if (collection.get(item.id)?.has(source)) {
        continue
      }
      if (!doesItemDropLoot(item, source)) {
        continue
      }
      if (!collection.has(item.id)) {
        collection.set(item.id, new Set())
      }
      collection.get(item.id).add(source)
    }
  }

  const result: SalvagedFrom[] = []
  collection.forEach((sources, id) => {
    const row: SalvagedFrom = {
      itemId: id,
      variations: [],
    }
    result.push(row)
    for (const source of sources) {
      row.variations.push(describeConditions(source, tagsToKeep))
    }
  })
  for (const row of result) {
    row.variations = uniqBy(row.variations, (it) => {
      return it.conditions.map((c) => `${c.tag}:${c.value}`).join(',') + ',' + it.tags.join(',')
    })
  }
  return result
}

export interface ConditionDescription {
  conditions: Array<{ tag: string; value: LootConditionValue }>
  tags: string[]
}

function describeConditions(node: LootNode, tagsToKeep: Set<string>): ConditionDescription {
  const conditions: Partial<Record<LootConditionTag, LootConditionValue>> = {}
  const tags: Record<string, any> = {}

  while (node) {
    if (node.bucket) {
      for (const tag of Object.values(node.bucket.Tags) || []) {
        if (isLootTagKnownCondition(tag.name)) {
          const value = mergeConditionValue(conditions[tag.name], tag.value)
          if (value != null) {
            conditions[tag.name] = value
          }
        } else {
          // if (tagsToKeep.has(tag.name)) {
          tags[tag.name] = tag.name
        }
      }
    }
    if (node.row) {
      for (const tag of node.table.Conditions || []) {
        const prob = Number(node.row.Prob)
        if (isLootTagKnownCondition(tag)) {
          const value = mergeConditionValue(conditions[tag], [prob])
          if (value != null) {
            conditions[tag] = value
          }
        } else {
          // if (tagsToKeep.has(tag)) {
          tags[tag] = tag
        }
      }
    }
    node = node.next
  }
  return {
    conditions: Object.entries(conditions)
      .map(([tag, value]) => {
        return {
          tag,
          value,
        }
      })
      .sort((a, b) => a.tag.localeCompare(b.tag)),
    tags: Object.values(tags).sort(),
  }
}

function mergeConditionValue(v1: LootConditionValue, v2: LootConditionValue): LootConditionValue {
  if (!v1?.length) {
    return v2
  }
  if (!v2?.length) {
    return v1
  }
  if (v1.length === 1 && v2.length === 1) {
    return [Math.max(v1[0], v2[0])]
  }

  let min = v1[0]
  let max = v1[1] ?? Number.MAX_VALUE
  min = Math.max(min, v2[0])
  max = Math.min(max, v2[1] ?? Number.MAX_VALUE)
  return [min, max]
}
