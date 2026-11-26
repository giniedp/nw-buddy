/// <reference lib="webworker" />
import { NwData, NwDataOptions, nwData } from '@nw-data/db'
import { CreatureType } from '@nw-data/generated'
import { expose, transfer } from 'comlink'
import { CaseInsensitiveMap } from '~/utils/caseinsensitive-map'
import { xyToLongLat } from '~/widgets/game-map/map-projection'
import { loadGatherables } from './data/gatherables'
import { PackedFilterDataSet, PackedVitalDataSet, copyMapData } from './data/packed'
import { loadVitals } from './data/vitals'

export interface ZoneMapTasks {
  /**
   * Maps that have gatherables
   */
  mapIds: (options: NwDataOptions) => Promise<string[]>
  /**
   * Gatherable layers with data on the given map, only that map's data is included
   */
  gatherables: (options: NwDataOptions, mapId: string) => Promise<PackedFilterDataSet[]>
  /**
   * Vitals of the given map, only that map's data is included
   */
  vitals: (options: NwDataOptions, mapId: string) => Promise<PackedVitalDataSet>
  /**
   * Creature types of all vitals, lower case
   */
  vitalsTypes: (options: NwDataOptions) => Promise<CreatureType[]>
}

interface Session {
  db: NwData
  gatherables: Promise<PackedFilterDataSet[]>
  vitals: Promise<PackedVitalDataSet>
}

const sessions = new Map<string, Session>()

function session(options: NwDataOptions): Session {
  const key = JSON.stringify(options)
  if (!sessions.has(key)) {
    const db = caseInsensitiveMaps(nwData(options))
    sessions.set(key, {
      db,
      gatherables: loadGatherables(db, xyToLongLat),
      vitals: loadVitals({ db, mapCoord: xyToLongLat }),
    })
  }
  return sessions.get(key)
}

/**
 * Index maps of the main thread nw-data proxy are case insensitive, the loaders rely on that
 */
function caseInsensitiveMaps(db: NwData): NwData {
  return new Proxy(db, {
    get(target, prop) {
      const value = target[prop]
      if (typeof value !== 'function') {
        return value
      }
      return async (...args: any[]) => {
        const result = await value.apply(target, args)
        if (result instanceof Map) {
          return new CaseInsensitiveMap(result)
        }
        return result
      }
    },
  })
}

const api: ZoneMapTasks = {
  mapIds: async (options) => {
    const layers = await session(options).gatherables
    const ids = new Set<string>()
    for (const layer of layers) {
      for (const mapId in layer.data) {
        ids.add(mapId)
      }
    }
    return Array.from(ids)
  },
  gatherables: async (options, mapId) => {
    const layers = await session(options).gatherables
    const transferables: Transferable[] = []
    const result: PackedFilterDataSet[] = []
    for (const layer of layers) {
      const data = layer.data[mapId]
      if (!data) {
        continue
      }
      result.push({
        ...layer,
        data: {
          [mapId]: copyMapData(data, transferables),
        },
      })
    }
    return transfer(result, transferables)
  },
  vitals: async (options, mapId) => {
    const vitals = await session(options).vitals
    const transferables: Transferable[] = []
    const result: PackedVitalDataSet = {
      count: vitals.count,
      data: {},
    }
    const mapData = vitals.data[mapId]
    if (mapData) {
      result.data[mapId] = {
        ...copyMapData(mapData, transferables),
        creatures: mapData.creatures,
      }
    }
    return transfer(result, transferables)
  },
  vitalsTypes: async (options) => {
    const index = await session(options).db.vitalsByCreatureTypeMap()
    return Array.from(index.keys())
  },
}

expose(api)
