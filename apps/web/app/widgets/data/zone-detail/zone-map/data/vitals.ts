import { TerritoryDefinition, VitalsData } from '@nw-data/generated'
import { ScannedVital } from '@nw-data/scanner'
import { combineLatest, map } from 'rxjs'
import { NwDataService } from '~/data'
import { FilterDataGroup, FilterDataSet, FilterVariant, VitalDataSet } from './types'
import { stringToColor } from '~/utils'
import { uniq } from 'lodash'

export type MapCoord = (coord: number[] | [number, number]) => number[]
export function loadVitals(db: NwDataService, mapCoord: MapCoord) {
  return combineLatest({
    vitals: db.vitals,
    vitalsMetaMap: db.vitalsMetadataMap,
    territoriesMap: db.territoriesMap,
  }).pipe(
    map((data) => {
      return collectVitalsDataset({
        ...data,
        mapCoord,
      })
    }),
  )
}

function collectVitalsDataset(data: {
  vitals: VitalsData[]
  vitalsMetaMap: Map<string, ScannedVital>
  territoriesMap: Map<number, TerritoryDefinition>
  mapCoord: MapCoord
}): VitalDataSet {
  const result: VitalDataSet = {
    count: 0,
    data: {},
  }

  for (const item of data.vitals) {
    const meta = data.vitalsMetaMap.get(item.VitalsID)
    const lvlSpawns = meta?.spawns || meta?.lvlSpanws
    if (!lvlSpawns) {
      continue
    }
    const lootTags = (item.LootTags || []).map((it) => (it || '').toLowerCase())
    for (const mapId in lvlSpawns) {
      const spawns = lvlSpawns[mapId]
      const layer = (result.data[mapId] = result.data[mapId] || {
        count: 0,
        geometry: {
          type: 'FeatureCollection',
          features: [],
        },
      })

      for (const spawn of spawns) {
        const levels = spawn.l
        const position = spawn.p
        const isRandom = spawn.r
        const poiTags = spawn.t.map((it) => data.territoriesMap.get(it)?.POITag || []).flat().map((it) => it.toLowerCase())
        for (const level of levels) {
          result.count++
          layer.count++
          layer.geometry.features.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: data.mapCoord(position),
            },
            properties: {
              id: item.VitalsID.toLowerCase(),
              level: level,
              color: stringToColor(item.VitalsID),
              categories: uniq([...(item.VitalsCategories || []), ...(spawn.c || [])].map((it) => (it || '').toLowerCase())),
              lootTags: lootTags,
              poiTags: poiTags,
              type: (item.CreatureType || '').toLowerCase(),
              random: isRandom,
            },
          })
        }
      }
    }
  }

  return result
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
