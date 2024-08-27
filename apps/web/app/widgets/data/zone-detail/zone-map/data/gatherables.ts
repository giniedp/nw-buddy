import { GatherableVariation, NW_FALLBACK_ICON } from '@nw-data/common'
import { GatherableData } from '@nw-data/generated'
import { ScannedGatherable, ScannedVariation } from '@nw-data/scanner'
import { combineLatest, map, switchMap } from 'rxjs'
import { NwDataService } from '~/data'
import { combineLatestOrEmpty, eqCaseInsensitive, stringToColor } from '~/utils'
import { getGatherableIcon, getTradeskillIcon } from '../../../gatherable-detail/utils'
import { describeAlchemyFilters } from '../utils/describe-alchemy-filters'
import { describeChestsFilters } from '../utils/describe-chests-filters'
import { describeDungeonFilters } from '../utils/describe-dungeon-filters'
import { describeFishingFilters } from '../utils/describe-fishing-filters'
import { describeHarvestingFilters } from '../utils/describe-harvesting-filters'
import { describeLoggingFilters } from '../utils/describe-logging-filters'
import { describeMiningFilters } from '../utils/describe-mining-filters'
import { describeSettlementFilters } from '../utils/describe-settlement-filters'
import { describeSkinningFilters } from '../utils/describe-skinning-filters'
import { parseLootTableID } from '../utils/parse-loottable'
import { getSizeColor, parseSizeVariant } from '../utils/parse-size-variant'
import { FilterDataSet, FilterDataGroup, FilterDataPropertiesWithVariant, FilterVariant } from './types'

export type MapCoord = (coord: number[] | [number, number]) => number[]
export function loadGatherables(db: NwDataService, mapCoord: MapCoord) {
  return combineLatest({
    gatherables: db.gatherables,
    gatherablesMeta: db.gatherablesMetadataMap,
    variationsByGatherableId: db.gatherableVariationsByGatherableIdMap,
    variationsMeta: db.variationsMetadataMap,
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

function loadAllChunks(db: NwDataService) {
  return db.variationsMetadata.pipe(
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
  for (const gatherable of data.gatherables) {
    const meta = data.gatherablesMeta.get(gatherable.GatherableID)
    const variations = data.variationsByGatherableId.get(gatherable.GatherableID)

    if (meta?.spawns?.length) {
      for (const spawn of meta.spawns) {
        const properties = describeGatherable(gatherable, gatherable.FinalLootTable)
        const groupId = generateId(properties)
        const id = `${groupId}&r=${spawn.encounter}`
        properties.color = properties.color || stringToColor(groupId)
        properties.encounter = spawn.encounter
        if (properties.variant) {
          properties.variant.color = getSizeColor(properties.variant.id, properties.color)
        }
        const layer = (result[id] = result[id] || {
          id,
          ...properties,
          variants: [],
          data: {},
          count: 0,
        })

        appendVariant(layer, properties.variant)

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
        mapData.geometry.features.push({
          type: 'Feature',
          properties: {
            ...properties,
            variant: properties.variant?.id,
            color: properties.variant?.color || properties.color,
          },
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
            const properties = describeGatherable(gatherable, lootTable, variant)
            const groupId = generateId(properties)
            const id = `${groupId}&r=${spawn.encounter}`
            properties.color = properties.color || stringToColor(groupId)
            properties.encounter = spawn.encounter
            if (properties.variant) {
              properties.variant.color = getSizeColor(properties.variant.id, properties.color)
            }
            const layer = (result[id] = result[id] || {
              id,
              ...properties,
              variants: [],
              data: {},
              count: 0,
            })
            appendVariant(layer, properties.variant)

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
            mapData.geometry.features.push({
              type: 'Feature',
              properties: {
                ...properties,
                variant: properties.variant?.id,
                color: properties.variant?.color || properties.color,
              },
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
): FilterDataPropertiesWithVariant {
  const lootTable = parseLootTableID(lootTableId)
  const icon = getGatherableIcon(gatherable)

  const props: FilterDataPropertiesWithVariant = {
    icon: icon,
    name: gatherable.DisplayName,
    color: null,
    lootTable: lootTable.original,

    section: gatherable.Tradeskill,
    sectionIcon: getTradeskillIcon(gatherable.Tradeskill) || NW_FALLBACK_ICON,
    category: lootTableId,
    categoryIcon: icon,
    subcategory: '',

    variant: null,
  }

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
  if (eqCaseInsensitive(lootTable.normalized, 'empty')) {
    props.section = '_Empty'
    props.sectionLabel = 'No Loottable'
    props.category = gatherable.DisplayName || gatherable.GatherableID
    props.categoryLabel = gatherable.DisplayName
    if (variant) {
      props.subcategory = variant.VariantID
      props.subcategoryLabel = variant.Name || variant.VariantID
    } else {
      props.subcategory = gatherable.GatherableID
      props.subcategoryLabel = gatherable.DisplayName
    }
    return props
  }

  if (eqCaseInsensitive(gatherable.Tradeskill, 'none')) {
    props.section = '_None'
    props.sectionLabel = 'No Tradeskill'
    // props.category = 'Empty'
    // props.categoryLabel = 'Empty'
    props.subcategory = variant?.VariantID || ''
    props.subcategoryLabel = variant?.Name || ''
    return props
  }

  {
    const found = parseSizeVariant(lootTable)
    if (found) {
      props.category = lootTable.normalized.replace(found.size, '')
      props.size = found.scale
      props.variant = {
        id: found.size,
        label: found.label,
        lootTable: lootTable.original,
        name: variant?.Name || gatherable.DisplayName,
      }
      return props
    }
  }

  return props
}

function generateId(properties: FilterDataGroup) {
  return `s=${properties.section}&c=${properties.category}&s=${properties.subcategory}`
}

function appendVariant(data: FilterDataSet, variant: FilterVariant) {
  if (!variant) {
    return
  }
  if (data.variants.some((it) => it.id === variant.id)) {
    return
  }
  data.variants.push(variant)
}
