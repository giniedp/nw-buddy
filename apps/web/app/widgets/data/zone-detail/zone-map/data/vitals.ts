import { TerritoryDefinition, VitalsData } from '@nw-data/generated'
import { ScannedVital } from '@nw-data/scanner'
import { Feature, MultiPoint } from 'geojson'
import { uniq } from 'lodash'
import { combineLatest, map } from 'rxjs'
import { NwDataService } from '~/data'
import { stringToColor } from '~/utils'
import { VitalDataProperties, VitalDataSet } from './types'

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
  const groups: Record<string, Record<string, Feature<MultiPoint, VitalDataProperties>>> = {}

  for (const item of data.vitals) {
    const meta = data.vitalsMetaMap.get(item.VitalsID)
    const lvlSpawns = meta?.spawns || meta?.lvlSpanws
    if (!lvlSpawns) {
      continue
    }
    const id = item.VitalsID.toLowerCase()
    const color = stringToColor(item.VitalsID)
    const type = (item.CreatureType || '').toLowerCase()
    const lootTags = (item.LootTags || []).map((it) => (it || '').toLowerCase())
    for (const mapId in lvlSpawns) {
      const spawns = lvlSpawns[mapId]
      const mapData = (groups[mapId] = groups[mapId] || {})
      for (const spawn of spawns) {
        const levels = spawn.l
        const position = spawn.p
        const random = spawn.r
        const poiTags = spawn.t
          .map((it) => data.territoriesMap.get(it)?.POITag || [])
          .flat()
          .map((it) => it.toLowerCase())
        const categories = uniq(
          [...(item.VitalsCategories || []), ...(spawn.c || [])].map((it) => (it || '').toLowerCase()),
        )
        for (const level of levels) {
          const key = [id, level, categories.join(), random].join(',')
          if (!mapData[key]) {
            mapData[key] = {
              type: 'Feature',
              geometry: {
                type: 'MultiPoint',
                coordinates: [],
              },
              properties: {
                id,
                level,
                color,
                categories,
                lootTags,
                poiTags,
                type,
                random,
              },
            }
          }

          mapData[key].geometry.coordinates.push(data.mapCoord(position))
        }
      }
    }
  }

  const result: VitalDataSet = {
    count: 0,
    data: {},
  }
  for (const mapId in groups) {
    const mapData = groups[mapId]
    for (const key in mapData) {
      const item = mapData[key]
      result.count++
      result.data[mapId] = result.data[mapId] || {
        count: 0,
        geometry: {
          type: 'FeatureCollection',
          features: [],
        },
      }
      result.data[mapId].count++
      result.data[mapId].geometry.features.push(item)
      const count = item.geometry.coordinates.length
    }
  }
  return result
}
