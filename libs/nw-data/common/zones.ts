import { Zone } from '../generated/meta-types'
import { TerritoryDefinition } from '../generated/types'
import { NW_FALLBACK_ICON } from './constants'

export type ZoneType = 'Territory' | 'Area' | 'POI'

export function isZoneTerritory(zone: TerritoryDefinition): zone is TerritoryDefinition {
  return getZoneType(zone) === 'Territory'
}

export function isZoneArea(zone: TerritoryDefinition): boolean {
  return getZoneType(zone) === 'Area'
}

export function isZonePoi(zone: TerritoryDefinition): boolean {
  return getZoneType(zone) === 'POI'
}

export function getZoneType(zone: TerritoryDefinition): ZoneType {
  if (!zone) {
    return null
  }
  if (!zone.IsPOI) {
    return 'Territory'
  }
  if (zone.IsArea) {
    return 'Area'
  }
  return 'POI'
}

export function getZoneMaxLevel(zone: TerritoryDefinition) {
  return zone?.MaximumLevel
}

export function getZoneRecommendedLevel(zone: TerritoryDefinition) {
  return zone?.RecommendedLevel
}

export function getZoneName(zone: TerritoryDefinition) {
  if (!zone) {
    return null
  }
  return zone.NameLocalizationKey
}

export function getZoneDevName(zone: TerritoryDefinition) {
  if (isZonePoi(zone)) {
    return zone.DevName
  }
  return null
}

export function getZoneDescription(zone: TerritoryDefinition) {
  if (isZonePoi(zone) && zone.NameLocalizationKey) {
    return `${zone.NameLocalizationKey}_description`
  }
  return null
}

export function getZoneInfo(zone: TerritoryDefinition) {
  if (isZoneArea(zone)) {
    return `AI Level: ${zone.AIVariantLevelOverride}`
  }
  if (isZoneTerritory(zone)) {
    return [zone.RecommendedLevel, zone.MaximumLevel]
      .filter((it) => !!it)
      .map((it) => (it > 65 ? `${65}+` : it))
      .join(' - ')
  }
  return ''
}

export function getZoneBackground(zone: TerritoryDefinition) {
  return zone?.TooltipBackground
}

export function getZoneIcon(zone: TerritoryDefinition, fallback = NW_FALLBACK_ICON) {
  if (!zone) {
    return null
  }
  return zone.MapIcon || zone.CompassIcon || fallback
}

export function getZoneMetaId(zone: TerritoryDefinition) {
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
