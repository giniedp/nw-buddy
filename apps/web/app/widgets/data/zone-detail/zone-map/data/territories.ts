import { getZoneIcon, getZoneMetaId, getZoneName, getZoneType } from '@nw-data/common'
import { NwData } from '@nw-data/db'
import { ScannedTerritory, TerritoryDefinition } from '@nw-data/generated'
import { Feature, FeatureCollection } from 'geojson'
import { combineLatest, map } from 'rxjs'
import { TranslateService } from '~/i18n'
import { eqCaseInsensitive } from '~/utils'

export type MapCoord = (coord: number[] | [number, number]) => number[]
type MapName = (territory: TerritoryDefinition) => string

export function loadTerritories(db: NwData, tl8: TranslateService, mapCoord: MapCoord) {
  const mapName = (territory: TerritoryDefinition) => tl8.get(getZoneName(territory))
  return combineLatest({
    locale: tl8.locale.value$,
    territories: db.territoriesAll(),
    meta: db.territoriesMetadataByIdMap(),
  }).pipe(
    map(({ territories, meta }) => {
      return territories.map((territory) => {
        return {
          territory,
          meta: meta.get(getZoneMetaId(territory)),
          type: getZoneType(territory),
        }
      })
    }),
    map((territories) => {
      return {
        territories: territoriesToFeatureCollection(
          territories.filter((it) => {
            return getZoneType(it.territory) === 'Territory' && !!it.meta?.geometry?.length
          }),
          mapCoord,
          mapName,
        ),
        areas: territoriesToFeatureCollection(
          territories.filter((it) => {
            return getZoneType(it.territory) === 'Area' && !!it.meta?.geometry?.length
          }),
          mapCoord,
          mapName,
        ),
        pois: territoriesToFeatureCollection(
          territories.filter((it) => {
            return getZoneType(it.territory) === 'POI' && !!it.meta?.geometry?.length
          }),
          mapCoord,
          mapName,
        ),
      }
    }),
  )
}

function territoriesToFeatureCollection(
  territories: Array<{ territory: TerritoryDefinition; meta: ScannedTerritory }>,
  mapCoord: MapCoord,
  mapName: MapName,
): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: territories.map(({ territory, meta }) => territoryToFeature(territory, meta, mapCoord, mapName)),
  }
}

function territoryToFeature(
  territory: TerritoryDefinition,
  meta: ScannedTerritory,
  mapCoord: MapCoord,
  mapName: MapName,
): Feature {
  const coords = meta.geometry[0].coordinates[0].map(mapCoord)
  coords.push([...coords[0]])
  return {
    type: 'Feature',
    id: territory.TerritoryID,
    properties: {
      id: territory.TerritoryID,
      type: getZoneType(territory),
      icon: territory.CompassIcon || getZoneIcon(territory, null),
      compassIcon: territory.UnchartedIcon ? territory.CompassIcon : null,
      name: mapName(territory),
      label: mapName(territory),
    },
    geometry: {
      type: 'Polygon',
      coordinates: [coords],
    },
  }
}

export async function loadRegionBoundaries(db: NwData, tl8: TranslateService, mapCoord: MapCoord) {
  let id = 0
  const regionsX = 8
  const regionsY = 8
  const regionSize = 2048
  const regions = Array.from({ length: regionsY })
    .map((_, y) => {
      return Array.from({ length: regionsX }).map((_, x) => {
        return {
          id: id++,
          label: `${x} | ${y}`,
          x,
          y,
          poly: [
            [x * regionSize, y * regionSize],
            [(x + 1) * regionSize, y * regionSize],
            [(x + 1) * regionSize, (y + 1) * regionSize],
            [x * regionSize, (y + 1) * regionSize],
          ],
        }
      })
    })
    .flat()
  const result: FeatureCollection = {
    type: 'FeatureCollection',
    features: regions.map((region): Feature => {
      const coords = region.poly.map(mapCoord)
      return {
        type: 'Feature',
        id: region.id,
        properties: {
          id: region.id,
          type: 'Region',
          label: region.label,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [coords],
        },
      }
    }),
  }
  return result
}

export async function loadZoneConfigs(db: NwData, tl8: TranslateService, mapCoord: MapCoord) {
  let id = 0
  const list = await db.zoneConfigsMetadataAll()
  const result: FeatureCollection = {
    type: 'FeatureCollection',
    features: list
      .map((config) => {
        return config.geometry.map((geometry, i): Feature => {
          const coords = geometry.coordinates[0].map(mapCoord)
          coords.push([...coords[0]])
          const featureId = id++
          return {
            type: 'Feature',
            id: featureId,
            properties: {
              id: featureId,
              type: 'ZoneConfig',
              icon: null,
              compassIcon: null,
              name: config.configName,
              title: config.configName,
              data: configs.find((it) => eqCaseInsensitive(it.name, config.configName)),
            },
            geometry: {
              type: 'Polygon',
              coordinates: [coords],
            },
          }
        })
      })
      .flat(),
  }
  return result
}

const configs = [
  {
    name: 'ConfigA',
    playercapacity: '20',
    maxspawnsperspawner: '5',
    backfilldelayduration: '3',
    backfilllimiteddelayduration: '15',
    shortcircuitduration: '120',
    overrideminrespawnduration: 360,
    overridemaxrespawnduration: 360,
    overrideminlimitedrespawnduration: 360,
    overridemaxlimitedrespawnduration: 360,
    minbackfilldistance: 10,
    backfillaiperplayer: 0,
    maxtrackedplayerscaling: '0',
  },
  {
    name: 'ConfigB',
    playercapacity: '20',
    maxspawnsperspawner: '5',
    backfilldelayduration: '3',
    backfilllimiteddelayduration: '15',
    shortcircuitduration: '120',
    overrideminrespawnduration: 360,
    overridemaxrespawnduration: 360,
    overrideminlimitedrespawnduration: 360,
    overridemaxlimitedrespawnduration: 360,
    minbackfilldistance: 10,
    backfillaiperplayer: 0,
    maxtrackedplayerscaling: '0',
  },
  {
    name: 'ConfigC',
    playercapacity: '15',
    maxspawnsperspawner: '4',
    backfilldelayduration: '3',
    backfilllimiteddelayduration: '15',
    shortcircuitduration: '120',
    overrideminrespawnduration: 360,
    overridemaxrespawnduration: 360,
    overrideminlimitedrespawnduration: 360,
    overridemaxlimitedrespawnduration: 360,
    minbackfilldistance: 10,
    backfillaiperplayer: 0,
    maxtrackedplayerscaling: '0',
  },
  {
    name: 'ConfigD',
    playercapacity: '15',
    maxspawnsperspawner: '3',
    backfilldelayduration: '3',
    backfilllimiteddelayduration: '15',
    shortcircuitduration: '120',
    overrideminrespawnduration: 240,
    overridemaxrespawnduration: 240,
    overrideminlimitedrespawnduration: 240,
    overridemaxlimitedrespawnduration: 240,
    minbackfilldistance: 10,
    backfillaiperplayer: 0,
    maxtrackedplayerscaling: '0',
  },
  {
    name: 'ConfigE',
    playercapacity: '10',
    maxspawnsperspawner: '3',
    backfilldelayduration: '3',
    backfilllimiteddelayduration: '15',
    shortcircuitduration: '120',
    overrideminrespawnduration: 240,
    overridemaxrespawnduration: 240,
    overrideminlimitedrespawnduration: 90,
    overridemaxlimitedrespawnduration: 90,
    minbackfilldistance: 10,
    backfillaiperplayer: 0,
    maxtrackedplayerscaling: '0',
  },
  {
    name: 'ConfigF',
    playercapacity: '8',
    maxspawnsperspawner: '3',
    backfilldelayduration: '3',
    backfilllimiteddelayduration: '15',
    shortcircuitduration: '120',
    overrideminrespawnduration: 240,
    overridemaxrespawnduration: 240,
    overrideminlimitedrespawnduration: 90,
    overridemaxlimitedrespawnduration: 90,
    minbackfilldistance: 10,
    backfillaiperplayer: 0,
    maxtrackedplayerscaling: '0',
  },
  {
    name: 'ConfigDebug',
    playercapacity: '0',
    maxspawnsperspawner: '3',
    backfilldelayduration: '3',
    backfilllimiteddelayduration: '15',
    shortcircuitduration: '120',
    overrideminrespawnduration: 240,
    overridemaxrespawnduration: 240,
    overrideminlimitedrespawnduration: 90,
    overridemaxlimitedrespawnduration: 90,
    minbackfilldistance: 10,
    backfillaiperplayer: 1,
    maxtrackedplayerscaling: '15',
  },
  {
    name: 'Config_ElitePOI',
    playercapacity: '15',
    maxspawnsperspawner: '4',
    backfilldelayduration: '3',
    backfilllimiteddelayduration: '15',
    shortcircuitduration: '120',
    overrideminrespawnduration: 360,
    overridemaxrespawnduration: 360,
    overrideminlimitedrespawnduration: 360,
    overridemaxlimitedrespawnduration: 360,
    minbackfilldistance: 10,
    backfillaiperplayer: 0,
    maxtrackedplayerscaling: '0',
  },
  {
    name: 'ConfigA_SpawnScaling',
    playercapacity: '15',
    maxspawnsperspawner: '5',
    backfilldelayduration: '3',
    backfilllimiteddelayduration: '15',
    shortcircuitduration: '120',
    overrideminrespawnduration: 600,
    overridemaxrespawnduration: 600,
    overrideminlimitedrespawnduration: 600,
    overridemaxlimitedrespawnduration: 600,
    minbackfilldistance: 10,
    backfillaiperplayer: 0.800000011920929,
    maxtrackedplayerscaling: '20',
  },
  {
    name: 'ConfigB_SpawnScaling',
    playercapacity: '15',
    maxspawnsperspawner: '5',
    backfilldelayduration: '3',
    backfilllimiteddelayduration: '15',
    shortcircuitduration: '120',
    overrideminrespawnduration: 480,
    overridemaxrespawnduration: 480,
    overrideminlimitedrespawnduration: 480,
    overridemaxlimitedrespawnduration: 480,
    minbackfilldistance: 10,
    backfillaiperplayer: 0.800000011920929,
    maxtrackedplayerscaling: '20',
  },
  {
    name: 'ConfigC_SpawnScaling',
    playercapacity: '2',
    maxspawnsperspawner: '3',
    backfilldelayduration: '6',
    backfilllimiteddelayduration: '15',
    shortcircuitduration: '120',
    overrideminrespawnduration: 300,
    overridemaxrespawnduration: 300,
    overrideminlimitedrespawnduration: 90,
    overridemaxlimitedrespawnduration: 90,
    minbackfilldistance: 10,
    backfillaiperplayer: 1.2000000476837158,
    maxtrackedplayerscaling: '20',
  },
  {
    name: 'ConfigD_SpawnScaling',
    playercapacity: '2',
    maxspawnsperspawner: '3',
    backfilldelayduration: '6',
    backfilllimiteddelayduration: '15',
    shortcircuitduration: '240',
    overrideminrespawnduration: 300,
    overridemaxrespawnduration: 300,
    overrideminlimitedrespawnduration: 90,
    overridemaxlimitedrespawnduration: 90,
    minbackfilldistance: 10,
    backfillaiperplayer: 1.2000000476837158,
    maxtrackedplayerscaling: '20',
  },
  {
    name: 'ConfigE_SpawnScaling',
    playercapacity: '2',
    maxspawnsperspawner: '3',
    backfilldelayduration: '6',
    backfilllimiteddelayduration: '20',
    shortcircuitduration: '180',
    overrideminrespawnduration: 300,
    overridemaxrespawnduration: 300,
    overrideminlimitedrespawnduration: 90,
    overridemaxlimitedrespawnduration: 90,
    minbackfilldistance: 10,
    backfillaiperplayer: 1.2000000476837158,
    maxtrackedplayerscaling: '20',
  },
  {
    name: 'ConfigF_SpawnScaling',
    playercapacity: '2',
    maxspawnsperspawner: '3',
    backfilldelayduration: '6',
    backfilllimiteddelayduration: '20',
    shortcircuitduration: '120',
    overrideminrespawnduration: 300,
    overridemaxrespawnduration: 300,
    overrideminlimitedrespawnduration: 90,
    overridemaxlimitedrespawnduration: 90,
    minbackfilldistance: 10,
    backfillaiperplayer: 1.2000000476837158,
    maxtrackedplayerscaling: '20',
  },
  {
    name: 'ConfigG_SpawnScaling',
    playercapacity: '2',
    maxspawnsperspawner: '3',
    backfilldelayduration: '6',
    backfilllimiteddelayduration: '20',
    shortcircuitduration: '120',
    overrideminrespawnduration: 300,
    overridemaxrespawnduration: 300,
    overrideminlimitedrespawnduration: 90,
    overridemaxlimitedrespawnduration: 90,
    minbackfilldistance: 10,
    backfillaiperplayer: 1.2000000476837158,
    maxtrackedplayerscaling: '20',
  },
  {
    name: 'ConfigH_SpawnScaling_StarterBeach',
    playercapacity: '2',
    maxspawnsperspawner: '3',
    backfilldelayduration: '6',
    backfilllimiteddelayduration: '15',
    shortcircuitduration: '120',
    overrideminrespawnduration: 180,
    overridemaxrespawnduration: 180,
    overrideminlimitedrespawnduration: 90,
    overridemaxlimitedrespawnduration: 90,
    minbackfilldistance: 10,
    backfillaiperplayer: 1.5,
    maxtrackedplayerscaling: '20',
  },
  {
    name: 'Config_SpawnScaling_05WC_Reekwater',
    playercapacity: '2',
    maxspawnsperspawner: '3',
    backfilldelayduration: '6',
    backfilllimiteddelayduration: '20',
    shortcircuitduration: '120',
    overrideminrespawnduration: 300,
    overridemaxrespawnduration: 300,
    overrideminlimitedrespawnduration: 90,
    overridemaxlimitedrespawnduration: 90,
    minbackfilldistance: 10,
    backfillaiperplayer: 1.2000000476837158,
    maxtrackedplayerscaling: '20',
  },
]
