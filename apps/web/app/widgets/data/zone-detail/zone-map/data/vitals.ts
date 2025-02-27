import { NwData } from '@nw-data/db'
import { TerritoryDefinition, VitalsBaseData as VitalsData } from '@nw-data/generated'
import { ScannedVital } from '@nw-data/generated'
import { Feature, MultiPoint } from 'geojson'
import { uniq } from 'lodash'
import { combineLatest, map } from 'rxjs'
import { eqCaseInsensitive, stringToColor } from '~/utils'
import { VitalDataSet, VitalsFeatureProperties } from './types'

export type MapCoord = (coord: number[] | [number, number]) => number[]
export function loadVitals({ db, mapCoord, mapIds }: { db: NwData; mapCoord: MapCoord; mapIds?: string[] }) {
  return combineLatest({
    vitals: db.vitalsAll(),
    vitalsMetaMap: db.vitalsMetadataByIdMap(),
    territoriesMap: db.territoriesByIdMap(),
  }).pipe(
    map((data) => {
      return collectVitalsDataset({
        ...data,
        mapCoord,
        mapIds,
      })
    }),
  )
}

function collectVitalsDataset(options: {
  vitals: VitalsData[]
  vitalsMetaMap: Map<string, ScannedVital>
  territoriesMap: Map<number, TerritoryDefinition>
  mapCoord: MapCoord
  mapIds?: string[]
}): VitalDataSet {
  type MapID = string
  let featureId = 0
  const groups: Record<MapID, Record<string, Feature<MultiPoint, VitalsFeatureProperties>>> = {}

  for (const item of options.vitals) {
    const meta = options.vitalsMetaMap.get(item.VitalsID)
    const lvlSpawns = meta?.spawns
    if (!lvlSpawns) {
      continue
    }
    const id = item.VitalsID.toLowerCase()
    const color = stringToColor(item.VitalsID)
    const type = (item.CreatureType || '').toLowerCase()
    const lootTags = (item.LootTags || []).map((it) => (it || '').toLowerCase())
    for (const mapId in lvlSpawns) {
      if (options.mapIds && !options.mapIds.some((it) => eqCaseInsensitive(it, mapId))) {
        continue
      }
      const spawns = lvlSpawns[mapId]
      const mapData = (groups[mapId] = groups[mapId] || {})
      for (const spawn of spawns) {
        const levels = spawn.l
        const position = spawn.p
        const encounter = spawn.e
        const poiTags = spawn.t
          .map((it) => options.territoriesMap.get(it)?.POITag || [])
          .flat()
          .map((it) => it.toLowerCase())
        const categories = uniq(
          [...(item.VitalsCategories || []), ...(spawn.c || [])].map((it) => (it || '').toLowerCase()),
        )
        for (const level of levels) {
          const key = [id, level, categories.join(), encounter.join()].join()
          if (!mapData[key]) {
            mapData[key] = {
              id: featureId++,
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
                encounter,
              },
            }
          }

          mapData[key].geometry.coordinates.push(options.mapCoord(position))
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
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      }
      result.data[mapId].count++
      result.data[mapId].data.features.push(item)
    }
  }
  return result
}
