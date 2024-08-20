import { Injectable } from '@angular/core'
import { getZoneType } from '@nw-data/common'
import { TerritoriesMetadata, TerritoryDefinition } from '@nw-data/generated'
import { Feature } from 'geojson'
import { xyToLngLat, xyFromLngLat, xToLng, xFromLng, yToLat, yFromLat } from './utils'

@Injectable({ providedIn: 'root' })
export class GameMapService {
  public xyToLngLat = xyToLngLat
  public xyFromLngLat = xyFromLngLat
  public xToLng = xToLng
  public xFromLng = xFromLng
  public yToLat = yToLat
  public yFromLat = yFromLat

  public territoryToFeature(territory: TerritoryDefinition, meta: TerritoriesMetadata): Feature {
    return {
      type: 'Feature',
      properties: {
        id: territory.TerritoryID,
        type: getZoneType(territory),
        item: territory,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [meta.zones[0].shape.map(xyToLngLat)],
      },
    }
  }
}
