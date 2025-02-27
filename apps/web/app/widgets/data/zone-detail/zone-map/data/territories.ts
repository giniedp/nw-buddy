import { getZoneIcon, getZoneMetaId, getZoneName, getZoneType } from '@nw-data/common'
import { NwData } from '@nw-data/db'
import { TerritoryDefinition } from '@nw-data/generated'
import { ScannedTerritory } from '@nw-data/generated'
import { Feature, FeatureCollection } from 'geojson'
import { combineLatest, map } from 'rxjs'
import { TranslateService } from '~/i18n'

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
  coords.push(coords[0])
  return {
    type: 'Feature',
    id: territory.TerritoryID,
    properties: {
      id: territory.TerritoryID,
      type: getZoneType(territory),
      icon: territory.CompassIcon || getZoneIcon(territory, null),
      compassIcon: territory.UnchartedIcon ? territory.CompassIcon : null,
      name: mapName(territory),
    },
    geometry: {
      type: 'Polygon',
      coordinates: [coords],
    },
  }
}
