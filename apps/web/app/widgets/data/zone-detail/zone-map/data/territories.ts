import { getZoneIcon, getZoneMetaId, getZoneName, getZoneType } from '@nw-data/common'
import { TerritoriesMetadata, TerritoryDefinition } from '@nw-data/generated'
import { Feature, FeatureCollection } from 'geojson'
import { combineLatest, map } from 'rxjs'
import { NwDataService } from '~/data'
import { TranslateService } from '~/i18n'

export type MapCoord = (coord: number[] | [number, number]) => number[]
type MapName = (territory: TerritoryDefinition) => string

export function loadTerritories(db: NwDataService, tl8: TranslateService, mapCoord: MapCoord) {
  const mapName = (territory: TerritoryDefinition) => tl8.get(getZoneName(territory))
  return combineLatest({
    locale: tl8.locale.value$,
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
          mapName
        ),
        areas: territoriesToFeatureCollection(
          territories.filter((it) => {
            return getZoneType(it.territory) === 'Area' && !!it.meta?.zones?.length
          }),
          mapCoord,
          mapName
        ),
        pois: territoriesToFeatureCollection(
          territories.filter((it) => {
            return getZoneType(it.territory) === 'POI' && !!it.meta?.zones?.length
          }),
          mapCoord,
          mapName
        ),
      }
    }),
  )
}

function territoriesToFeatureCollection(
  territories: Array<{ territory: TerritoryDefinition; meta: TerritoriesMetadata }>,
  mapCoord: MapCoord,
  mapName: MapName,
): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: territories.map(({ territory, meta }) => territoryToFeature(territory, meta, mapCoord, mapName)),
  }
}

function territoryToFeature(territory: TerritoryDefinition, meta: TerritoriesMetadata, mapCoord: MapCoord, mapName: MapName): Feature {
  const coords = meta.zones[0].shape.map(mapCoord)
  coords.push(coords[0])
  return {
    type: 'Feature',
    id: territory.TerritoryID,
    properties: {
      id: territory.TerritoryID,
      type: getZoneType(territory),
      icon: getZoneIcon(territory, null),
      name: mapName(territory),
    },
    geometry: {
      type: 'Polygon',
      coordinates: [coords],
    },
  }
}
