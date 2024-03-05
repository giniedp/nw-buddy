import { Areadefinitions, PoiDefinition, TerritoriesMetadata, Territorydefinitions, Zone } from '../generated/types'
import { NW_FALLBACK_ICON } from './constants'

export type ZoneDefinition = Territorydefinitions | Areadefinitions | PoiDefinition
export type ZoneType = 'Territory' | 'Area' | 'POI'

export function isZoneTerritory(zone: ZoneDefinition): zone is Territorydefinitions {
  return getZoneType(zone) === 'Territory'
}

export function isZoneArea(zone: ZoneDefinition): zone is Areadefinitions {
  return getZoneType(zone) === 'Area'
}

export function isZonePoi(zone: ZoneDefinition): zone is PoiDefinition {
  return getZoneType(zone) === 'POI'
}

export function getZoneType(zone: ZoneDefinition) {
  if (!zone) {
    return null
  }
  if (!zone.IsPOI) {
    return 'Territory'
  }
  if ((zone as Areadefinitions).IsArea) {
    return 'Area'
  }
  return 'POI'
}

export function getZoneMaxLevel(zone: ZoneDefinition) {
  return (zone as Territorydefinitions)?.MaximumLevel
}

export function getZoneRecommendedLevel(zone: ZoneDefinition) {
  return (zone as Territorydefinitions)?.RecommendedLevel
}

export function getZoneName(zone: ZoneDefinition) {
  return zone?.NameLocalizationKey
}

export function getZoneDescription(zone: ZoneDefinition) {
  if (isZonePoi(zone) && zone.NameLocalizationKey) {
    return `${zone.NameLocalizationKey}_description`
  }
  return null
}

export function getZoneInfo(zone: ZoneDefinition) {
  if (isZoneArea(zone)) {
    return `AI Level: ${zone.AIVariantLevelOverride}`
  }
  if (isZoneTerritory(zone)) {
    return [zone.RecommendedLevel, zone.MaximumLevel]
      .filter((it) => !!it)
      .map((it) => it > 65 ? `${65}+` : it)
      .join(' - ')
  }
  return ''
}

export function getZoneIcon(zone: ZoneDefinition) {
  if (!zone) {
    return null
  }
  if (isZoneTerritory(zone)) {
    return NW_FALLBACK_ICON
  }
  if (isZoneArea(zone)) {
    return NW_FALLBACK_ICON
  }
  return zone.MapIcon || zone.CompassIcon || NW_FALLBACK_ICON
}

export function getZoneMetaId(zone: ZoneDefinition) {
  const id = zone?.TerritoryID
  if (!id) {
    return null
  }
  return id < 10 ? `0${id}` : String(id || '')
}

export function isPointInZone(point: number[], zone: Zone) {
  if (!zone || !point?.length) {
    return false
  }
  if (!isPointInAABB(point, zone.min, zone.max)) {
    return false
  }
  if (!isPointInPolygon(point, zone.shape)) {
    return false
  }
  return true
}

function isPointInAABB(point: number[], min: number[], max: number[]) {
  const x = point[0]
  const y = point[1]
  if (x < min[0] || x > max[0] || y < min[1] || y > max[1]) {
    return false
  }
  return true
}

function isPointInPolygon(point: number[], vs: number[][]) {
  // ray-casting algorithm based on
  // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html

  const x = point[0]
  const y = point[1]

  let inside = false
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0]
    const yi = vs[i][1]
    const xj = vs[j][0]
    const yj = vs[j][1]

    var intersect = yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) {
      inside = !inside
    }
  }

  return inside
}
