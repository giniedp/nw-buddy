import { LoreData } from '@nw-data/generated'
import { ScannedLore } from '@nw-data/scanner'
import { combineLatest, map } from 'rxjs'
import { NwDataService } from '~/data'
import { stringToColor } from '~/utils'
import { describeLoreFilters } from '../utils/describe-lore-filters'
import { FilterGroup, FilterDataSet, FilterVariant } from './types'

export type MapCoord = (coord: number[] | [number, number]) => number[]
export function loadLore(db: NwDataService, mapCoord: MapCoord) {

  return combineLatest({
    loreItems: db.loreItems,
    loreItemsMetaMap: db.loreItemsMetaMap,
    loreItemsMap: db.loreItemsMap,
  }).pipe(
    map((data) => {
      return collectLoreDatasets({
        ...data,
        mapCoord,
      })
    }),
  )
}

function collectLoreDatasets(data: {
  loreItems: LoreData[]
  loreItemsMetaMap: Map<string, ScannedLore>
  loreItemsMap: Map<string, LoreData>
  mapCoord: MapCoord
}): FilterDataSet[] {
  const result: Record<string, FilterDataSet> = {}
  let featureId = 0
  for (const item of data.loreItems) {
    const meta = data.loreItemsMetaMap.get(item.LoreID)
    if (!meta?.spawns?.length) {
      continue
    }
    let topic: LoreData
    let chapter: LoreData
    if (item.Type === 'Topic') {
      topic = item
    }
    if (item.Type === 'Chapter') {
      topic = data.loreItemsMap.get(item.ParentID)
      chapter = item
    }
    if (item.Type === 'Default'){
      chapter = data.loreItemsMap.get(item.ParentID)
      topic = data.loreItemsMap.get(chapter?.ParentID)
    }

    for (const spawn of meta.spawns) {
      const properties = describeLoreFilters(item, topic, chapter)
      const id = generateId(properties)
      properties.color = properties.color || stringToColor(id)
      if (properties.variant) {
        // properties.variant.color = getSizeColor(properties.variant.id, properties.color)
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
        id: featureId++,
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
  return Object.values(result)
}

function generateId(properties: FilterGroup) {
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
