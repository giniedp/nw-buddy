import { GatherableVariation } from '@nw-data/common'
import { NwData } from '@nw-data/db'
import { GatherableData } from '@nw-data/generated'
import { ScannedGatherable, ScannedVariation } from '@nw-data/generated'
import { combineLatest, from, map, switchMap } from 'rxjs'
import { svgLocationQuestion, svgStaff } from '~/ui/icons/svg'
import { combineLatestOrEmpty, eqCaseInsensitive, stringToHSL } from '~/utils'
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
import { FilterDataSet, FilterGroup } from './types'

export type MapCoord = (coord: number[] | [number, number]) => number[]
export function loadGatherables(db: NwData, mapCoord: MapCoord) {
  return combineLatest({
    gatherables: db.gatherablesAll(),
    gatherablesMeta: db.gatherablesMetadataByIdMap(),
    variationsByGatherableId: db.gatherableVariationsByGatherableIdMap(),
    variationsMeta: db.variationsMetadataByIdMap(),
    chunks: loadAllChunks(db),
  }).pipe(
    map((data) =>
      collectGatherableDatasets({
        ...data,
        mapCoord,
      }),
    ),
  )
}

function loadAllChunks(db: NwData) {
  return from(db.variationsMetadataAll()).pipe(
    switchMap((list) => {
      const chunkIds: number[] = []
      for (const item of list) {
        for (const spawn of item.spawns) {
          if (!chunkIds.includes(spawn.positions.chunkID)) {
            chunkIds.push(spawn.positions.chunkID)
          }
        }
      }
      return combineLatestOrEmpty(chunkIds.map((id) => db.variationsChunk(id)))
    }),
  )
}
function collectGatherableDatasets(data: {
  gatherables: GatherableData[]
  gatherablesMeta: Map<string, ScannedGatherable>
  variationsByGatherableId: Map<string, GatherableVariation[]>
  variationsMeta: Map<string, ScannedVariation>
  chunks: Array<number[][]>
  mapCoord: MapCoord
}): FilterDataSet[] {
  const result: Record<string, FilterDataSet> = {}
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
        const points = spawn.positions.map(data.mapCoord)
        const mapData = (layer.data[mapId] = layer.data[mapId] || {
          count: 0,
          geometry: {
            type: 'FeatureCollection',
            features: [],
          },
        })
        layer.count += points.length
        mapData.count += points.length
        featureId++
        mapData.geometry.features.push({
          id: featureId,
          type: 'Feature',
          properties: properties,
          geometry: {
            type: 'MultiPoint',
            coordinates: points,
          },
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
              geometry: {
                type: 'FeatureCollection',
                features: [],
              },
            })
            const chunk = spawn.positions
            const points = data.chunks[chunk.chunkID]
              .slice(chunk.elementOffset, chunk.elementOffset + chunk.elementCount)
              .map(data.mapCoord)
            layer.count += points.length
            mapData.count += points.length
            featureId++
            mapData.geometry.features.push({
              id: featureId,
              type: 'Feature',
              properties: properties,
              geometry: {
                type: 'MultiPoint',
                coordinates: points,
              },
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

function appendVariant(data: FilterDataSet, group: FilterGroup) {
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
