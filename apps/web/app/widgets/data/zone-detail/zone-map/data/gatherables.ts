import { GatherableVariation } from '@nw-data/common'
import { NwData } from '@nw-data/db'
import { GatherableData } from '@nw-data/generated'
import { ScannedGatherable, ScannedVariation } from '@nw-data/generated'
import { svgLocationQuestion, svgStaff } from '~/ui/icons/svg'
import { eqCaseInsensitive } from '~/utils/caseinsensitive-compare'
import { stringToHSL } from '~/utils/colors'
import { getGatherableIcon } from '../../../gatherable-detail/utils'
import { describeAlchemyFilters } from '../utils/describe-alchemy-filters'
import { describeChestsFilters } from '../utils/describe-chests-filters'
import { describeDungeonFilters } from '../utils/describe-dungeon-filters'
import { describeFishingFilters } from '../utils/describe-fishing-filters'
import { describeHarvestingFilters } from '../utils/describe-harvesting-filters'
import { describeLoggingFilters } from '../utils/describe-logging-filters'
import { describeMiningFilters } from '../utils/describe-mining-filters'
import { describeSettlementFilters } from '../utils/describe-settlement-filters'
import { describeSkinningFilters } from '../utils/describe-skinning-filters'
import { describeVistaFilters } from '../utils/describe-vista-filters'
import { describeGatheringFilters } from '../utils/descrive-gathering-filters'
import { parseLootTableID } from '../utils/parse-loottable'
import { getSizeColor, parseSizeVariant } from '../utils/parse-size-variant'
import { PackedFilterDataSet, packPositions } from './packed'
import { FilterGroup } from './types'

export type MapCoord = (coord: [number, number]) => number[]

/**
 * Gatherable layers of all maps
 */
export async function loadGatherables(db: NwData, mapCoord: MapCoord) {
  const [gatherables, gatherablesMeta, variationsByGatherableId, variationsMeta, chunks] = await Promise.all([
    db.gatherablesAll(),
    db.gatherablesMetadataByIdMap(),
    db.gatherableVariationsByGatherableIdMap(),
    db.variationsMetadataByIdMap(),
    loadAllChunks(db),
  ])
  return collectGatherableDatasets({
    gatherables,
    gatherablesMeta,
    variationsByGatherableId,
    variationsMeta,
    chunks,
    mapCoord,
  })
}

async function loadAllChunks(db: NwData) {
  const list = await db.variationsMetadataAll()
  const chunkIds = new Set<number>()
  for (const item of list) {
    for (const spawn of item.spawns) {
      chunkIds.add(spawn.positions.chunkID)
    }
  }
  const chunks: Float32Array[] = []
  await Promise.all(
    Array.from(chunkIds).map(async (id) => {
      chunks[id] = await db.variationsChunkData(id)
    }),
  )
  return chunks
}

function collectGatherableDatasets(data: {
  gatherables: GatherableData[]
  gatherablesMeta: Map<string, ScannedGatherable>
  variationsByGatherableId: Map<string, GatherableVariation[]>
  variationsMeta: Map<string, ScannedVariation>
  chunks: Float32Array[]
  mapCoord: MapCoord
}): PackedFilterDataSet[] {
  const result: Record<string, PackedFilterDataSet> = {}
  const projected: number[] = []
  const project = (x: number, y: number) => {
    const [lng, lat] = data.mapCoord([x, y])
    projected.push(lng, lat)
  }
  let featureId = 0
  for (const gatherable of data.gatherables) {
    const meta = data.gatherablesMeta.get(gatherable.GatherableID)
    const variations = data.variationsByGatherableId.get(gatherable.GatherableID)

    if (meta?.spawns?.length) {
      for (const spawn of meta.spawns) {
        const group = describeGatherable(gatherable, gatherable.FinalLootTable)
        if (!group) {
          continue
        }
        const groupId = generateId(group)
        const properties = group.properties
        properties.color ||= stringToHSL(groupId).toHexString()
        properties.encounter ||= spawn.encounter || ''
        properties.variant ||= group.variantID || ''
        if (properties.variant) {
          properties.color = getSizeColor(properties.variant, properties.color)
        }
        const layerId = `${groupId},${properties.encounter}`
        const layer = (result[layerId] = result[layerId] || {
          id: layerId,
          ...group,
          variants: [],
          data: {},
          count: 0,
        })
        appendVariant(layer, group)

        const mapId = spawn.mapID
        projected.length = 0
        for (const [x, y] of spawn.positions) {
          project(x, y)
        }
        const count = spawn.positions.length
        const mapData = (layer.data[mapId] = layer.data[mapId] || {
          count: 0,
          features: [],
        })
        layer.count += count
        mapData.count += count
        featureId++
        mapData.features.push({
          id: featureId,
          properties: properties,
          positions: packPositions(projected),
        })
      }
    }

    if (variations) {
      for (const variant of variations) {
        const meta = data.variationsMeta.get(variant.VariantID)
        if (!meta?.spawns?.length || !variant.Gatherables?.length) {
          continue
        }
        const found = variant.Gatherables.find((it) => eqCaseInsensitive(it.GatherableID, gatherable.GatherableID))
        let lootTables = found.LootTable
        if (lootTables.length === 0) {
          lootTables = [gatherable.FinalLootTable]
        }
        for (const lootTable of lootTables) {
          for (const spawn of meta.spawns) {
            const group = describeGatherable(gatherable, lootTable, variant)
            if (!group) {
              continue
            }
            const groupId = generateId(group)
            const properties = group.properties
            properties.color ||= stringToHSL(groupId).toHexString()
            properties.encounter ||= spawn.encounter || ''
            properties.variant ||= group.variantID || ''
            if (properties.variant) {
              properties.color = getSizeColor(properties.variant, properties.color)
            }
            const layerId = `${groupId},${properties.encounter}`
            const layer = (result[layerId] = result[layerId] || {
              id: layerId,
              ...group,
              variants: [],
              data: {},
              count: 0,
            })
            appendVariant(layer, group)

            const mapId = spawn.mapID
            const mapData = (layer.data[mapId] = layer.data[mapId] || {
              count: 0,
              features: [],
            })
            const chunk = spawn.positions
            const source = data.chunks[chunk.chunkID]
            const start = chunk.elementOffset * 2
            const end = Math.min(source.length, (chunk.elementOffset + chunk.elementCount) * 2)
            projected.length = 0
            for (let i = start; i < end; i += 2) {
              project(source[i], source[i + 1])
            }
            const count = (end - start) / 2
            layer.count += count
            mapData.count += count
            featureId++
            mapData.features.push({
              id: featureId,
              properties: properties,
              positions: packPositions(projected),
            })
          }
        }
      }
    }
  }
  return Object.values(result)
}

function describeGatherable(
  gatherable: GatherableData,
  lootTableId: string,
  variant?: GatherableVariation,
): FilterGroup {
  const lootTable = parseLootTableID(lootTableId)

  {
    const result = describeAlchemyFilters(lootTable, gatherable, variant)
    if (result) {
      return result
    }
  }

  {
    const result = describeFishingFilters(lootTable, gatherable, variant)
    if (result) {
      return result
    }
  }

  {
    const result = describeDungeonFilters(lootTable, gatherable, variant)
    if (result) {
      return result
    }
  }

  {
    const result = describeChestsFilters(lootTable, gatherable, variant)
    if (result) {
      return result
    }
  }

  {
    const result = describeMiningFilters(lootTable, gatherable, variant)
    if (result) {
      return result
    }
  }

  {
    const result = describeLoggingFilters(lootTable, gatherable, variant)
    if (result) {
      return result
    }
  }

  {
    const result = describeHarvestingFilters(lootTable, gatherable, variant)
    if (result) {
      return result
    }
  }

  {
    const result = describeSkinningFilters(lootTable, gatherable, variant)
    if (result) {
      return result
    }
  }

  {
    const result = describeSettlementFilters(lootTable, gatherable, variant)
    if (result) {
      return result
    }
  }

  {
    const result = describeGatheringFilters(lootTable, gatherable, variant)
    if (result) {
      return result
    }
  }

  {
    const result = describeVistaFilters(lootTable, gatherable, variant)
    if (result) {
      return result
    }
  }

  const icon = getGatherableIcon(gatherable)
  const result: FilterGroup = {
    section: gatherable.Tradeskill,
    sectionLabel: gatherable.Tradeskill,
    sectionIcon: svgLocationQuestion,
    category: lootTableId,
    categoryIcon: icon,
    subcategory: '',
    icons: false,
    labels: false,
    properties: {
      icon: icon,
      label: null,
      size: 1,
      color: null,
      title: gatherable.DisplayName,
      subtitle: variant?.Name,
      lootTableID: lootTable.original,
      gatherableID: gatherable.GatherableID,
      variationID: variant?.VariantID,
      loreID: null,
    },
  }

  if (eqCaseInsensitive(gatherable.Tradeskill, 'AzothStaff')) {
    result.sectionIcon = svgStaff
  }

  if (eqCaseInsensitive(lootTable.normalized, 'empty')) {
    result.section = '_Empty'
    result.sectionLabel = 'No Loottable'
    result.category = gatherable.DisplayName || gatherable.GatherableID
    result.categoryLabel = gatherable.DisplayName
    if (variant) {
      result.subcategory = variant.VariantID
      result.subcategoryLabel = variant.Name || variant.VariantID
    } else {
      result.subcategory = gatherable.GatherableID
      result.subcategoryLabel = gatherable.DisplayName
    }
    return result
  }

  if (eqCaseInsensitive(gatherable.Tradeskill, 'none')) {
    result.section = '_None'
    result.sectionLabel = 'No Tradeskill'
    // props.category = 'Empty'
    // props.categoryLabel = 'Empty'
    result.subcategory = variant?.VariantID || ''
    result.subcategoryLabel = variant?.Name || ''
    return result
  }

  {
    const found = parseSizeVariant(lootTable)
    if (found) {
      result.category = lootTable.normalized.replace(found.size, '')
      result.properties.size = found.scale
      result.variantID = found.size
      result.variantLabel = found.label
      return result
    }
  }

  return result
}

function generateId(group: FilterGroup) {
  return [group.section, group.category, group.subcategory].join()
}

function appendVariant(data: PackedFilterDataSet, group: FilterGroup) {
  if (!group?.variantID) {
    return
  }
  if (data.variants.some((it) => it.id === group.variantID)) {
    return
  }
  data.variants.push({
    id: group.variantID,
    label: group.variantLabel,
    icon: group.variantIcon,
    properties: group.properties,
  })
}
