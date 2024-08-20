import { getZoneIcon, getZoneMetaId, getZoneName, getZoneType } from '@nw-data/common'
import { TerritoriesMetadata, TerritoryDefinition } from '@nw-data/generated'
import { Feature, FeatureCollection } from 'geojson'
import { combineLatest, map } from 'rxjs'
import { NwDataService } from '~/data'

export type MapCoord = (coord: number[] | [number, number]) => number[]
export function loadTerritories(db: NwDataService, mapCoord: MapCoord) {
  return combineLatest({
    territories: db.territories,
    meta: db.territoriesMetadataMap,
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
            return getZoneType(it.territory) === 'Territory' && !!it.meta?.zones?.length
          }),
          mapCoord,
        ),
        areas: territoriesToFeatureCollection(
          territories.filter((it) => {
            return getZoneType(it.territory) === 'Area' && !!it.meta?.zones?.length
          }),
          mapCoord,
        ),
        pois: territoriesToFeatureCollection(
          territories.filter((it) => {
            return getZoneType(it.territory) === 'POI' && !!it.meta?.zones?.length
          }),
          mapCoord,
        ),
      }
    }),
  )
}

function territoriesToFeatureCollection(
  territories: Array<{ territory: TerritoryDefinition; meta: TerritoriesMetadata }>,
  mapCoord: MapCoord,
): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: territories.map(({ territory, meta }) => territoryToFeature(territory, meta, mapCoord)),
  }
}

function territoryToFeature(territory: TerritoryDefinition, meta: TerritoriesMetadata, mapCoord: MapCoord): Feature {
  const coords = meta.zones[0].shape.map(mapCoord)
  coords.push(coords[0])
  return {
    type: 'Feature',
    id: territory.TerritoryID,
    properties: {
      id: territory.TerritoryID,
      type: getZoneType(territory),
      item: territory,
      icon: getZoneIcon(territory, null),
      name: getZoneName(territory),
    },
    geometry: {
      type: 'Polygon',
      coordinates: [coords],
    },
  }
}
