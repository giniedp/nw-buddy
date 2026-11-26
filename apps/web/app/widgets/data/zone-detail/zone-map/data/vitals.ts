import { NwData } from '@nw-data/db'
import { ScannedVital, TerritoryDefinition, VitalsBaseData as VitalsData } from '@nw-data/generated'
import { uniq } from 'lodash'
import { stringToColor } from '~/utils/colors'
import { PackedFeature, PackedVitalDataSet, packPositions } from './packed'
import { VitalCreature, VitalsFeatureProperties } from './types'

export type MapCoord = (coord: [number, number]) => number[]

/**
 * Vitals of all maps, one multi point feature per vitals id, level, categories and encounter
 */
export async function loadVitals({ db, mapCoord }: { db: NwData; mapCoord: MapCoord }) {
  const [vitals, vitalsMetaMap, territoriesMap] = await Promise.all([
    db.vitalsAll(),
    db.vitalsMetadataByIdMap(),
    db.territoriesByIdMap(),
  ])
  return collectVitalsDataset({ vitals, vitalsMetaMap, territoriesMap, mapCoord })
}

function collectVitalsDataset(options: {
  vitals: VitalsData[]
  vitalsMetaMap: Map<string, ScannedVital>
  territoriesMap: Map<number, TerritoryDefinition>
  mapCoord: MapCoord
}): PackedVitalDataSet {
  type MapID = string
  interface Group {
    feature: PackedFeature<VitalsFeatureProperties>
    points: number[]
  }
  let featureId = 0
  const groups: Record<MapID, Record<string, Group>> = {}
  const creatures: Record<MapID, Record<string, VitalCreature>> = {}

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
      const spawns = lvlSpawns[mapId]
      const mapData = (groups[mapId] = groups[mapId] || {})
      const mapCreatures = (creatures[mapId] = creatures[mapId] || {})
      const creature = (mapCreatures[id] = mapCreatures[id] || {
        id,
        name: item.DisplayName,
        type,
        count: 0,
        minLevel: null,
        maxLevel: null,
      })
      for (const spawn of spawns) {
        for (const level of spawn.l) {
          creature.count += spawn.p.length
          creature.minLevel = Math.min(creature.minLevel ?? level, level)
          creature.maxLevel = Math.max(creature.maxLevel ?? level, level)
        }
        const levels = spawn.l
        const encounter = spawn.e
        const points = spawn.p.flatMap((it) => options.mapCoord(it).slice(0, 2))
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
              points: [],
              feature: {
                id: featureId++,
                positions: null,
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
              },
            }
          }
          for (const value of points) {
            mapData[key].points.push(value)
          }
        }
      }
    }
  }

  const result: PackedVitalDataSet = {
    count: 0,
    data: {},
  }
  for (const mapId in groups) {
    const mapData = groups[mapId]
    for (const key in mapData) {
      const { feature, points } = mapData[key]
      feature.positions = packPositions(points)
      result.count++
      result.data[mapId] = result.data[mapId] || {
        count: 0,
        features: [],
        creatures: Object.values(creatures[mapId] || {}).filter((it) => it.count > 0),
      }
      result.data[mapId].count++
      result.data[mapId].features.push(feature)
    }
  }
  return result
}
