import { describeNodeSize, getGatherableNodeSizes } from '@nw-data/common'
import { NwData } from '@nw-data/db'
import { HouseTypeData } from '@nw-data/generated'
import { ScannedStation, ScannedStructure } from '@nw-data/generated'
import { groupBy } from 'lodash'
import { combineLatest, map } from 'rxjs'
import { TranslateService } from '~/i18n'
import { svgHouse } from '~/ui/icons/svg'
import { humanize, stringToHSL } from '~/utils'
import { getSizeColor } from '../utils/parse-size-variant'
import { FilterDataSet, FilterGroup } from './types'

export type MapCoord = (coord: number[] | [number, number]) => number[]

export function loadStructures(db: NwData, tl8: TranslateService, mapCoord: MapCoord) {
  return combineLatest({
    locale: tl8.locale.value$,
    houseTypes: db.houseTypesAll(),
    metaMap: db.houseTypesMetaByIdMap(),
    stations: db.stationTypesMetaAll(),
    structures: db.structureTypesMetaAll(),
  }).pipe(
    map(({ houseTypes, metaMap, structures, stations }) => {
      const result: Record<string, FilterDataSet> = {}

      let featureId = 0
      for (const houseType of houseTypes) {
        const meta = metaMap.get(houseType.HouseTypeID)
        if (!meta) {
          continue
        }

        const groups = groupBy(meta.houses, (it) => it.mapID)
        for (const [mapId, houses] of Object.entries(groups)) {
          const group = describeHouse(houseType, tl8)
          const groupId = generateId(group)
          const layerId = `house-${groupId}`
          const properties = group.properties
          properties.color ||= stringToHSL(groupId).toHexString()
          properties.variant ||= group.variantID
          if (properties.variant) {
            properties.color = getSizeColor(properties.variant, properties.color)
          }
          const layer = (result[layerId] = result[layerId] || {
            id: layerId,
            ...group,
            variants: [],
            data: {},
            count: 0,
          })
          appendVariant(layer, group)

          const points = houses.map((it) => mapCoord(it.position))
          const mapData = (layer.data[mapId] = layer.data[mapId] || {
            count: 0,
            geometry: {
              type: 'FeatureCollection',
              features: [],
            },
          })
          layer.count += points.length
          mapData.count += points.length
          featureId++
          mapData.geometry.features.push({
            id: featureId,
            type: 'Feature',
            properties: properties,
            geometry: {
              type: 'MultiPoint',
              coordinates: points,
            },
          })
        }
      }

      for (const row of stations) {
        const groups = groupBy(row.stations, (it) => [it.mapID, it.stationID])
        for (const stations of Object.values(groups)) {
          const group = describeStation(stations[0], tl8)
          const groupId = generateId(group)
          const layerId = `station-${groupId}`
          const properties = group.properties
          properties.color ||= stringToHSL(groupId).toHexString()
          properties.variant ||= group.variantID
          if (properties.variant) {
            properties.color = getSizeColor(properties.variant, properties.color)
          }
          const layer = (result[layerId] = result[layerId] || {
            id: layerId,
            ...group,
            variants: [],
            data: {},
            count: 0,
          })
          appendVariant(layer, group)
          const mapId = stations[0].mapID
          const points = stations.map((it) => mapCoord(it.position))
          const mapData = (layer.data[mapId] = layer.data[mapId] || {
            count: 0,
            geometry: {
              type: 'FeatureCollection',
              features: [],
            },
          })
          layer.count += points.length
          mapData.count += points.length
          featureId++
          mapData.geometry.features.push({
            id: featureId,
            type: 'Feature',
            properties: properties,
            geometry: {
              type: 'MultiPoint',
              coordinates: points,
            },
          })
        }
      }

      for (const row of structures) {
        const groups = groupBy(row.structures, (it) => [it.mapID, it.type])
        for (const structures of Object.values(groups)) {
          const group = describeStructure(structures[0], tl8)
          const groupId = generateId(group)
          const layerId = `station-${groupId}`
          const properties = group.properties
          properties.color ||= stringToHSL(groupId).toHexString()
          properties.variant ||= group.variantID
          if (properties.variant) {
            properties.color = getSizeColor(properties.variant, properties.color)
          }
          const layer = (result[layerId] = result[layerId] || {
            id: layerId,
            ...group,
            variants: [],
            data: {},
            count: 0,
          })
          appendVariant(layer, group)

          const mapId = structures[0].mapID
          const points = structures.map((it) => mapCoord(it.position))
          const mapData = (layer.data[mapId] = layer.data[mapId] || {
            count: 0,
            geometry: {
              type: 'FeatureCollection',
              features: [],
            },
          })
          layer.count += points.length
          mapData.count += points.length
          featureId++
          mapData.geometry.features.push({
            id: featureId,
            type: 'Feature',
            properties: properties,
            geometry: {
              type: 'MultiPoint',
              coordinates: points,
            },
          })
        }
      }
      return Object.values(result)
    }),
  )
}

function describeHouse(house: HouseTypeData, tl8: TranslateService): FilterGroup {
  const tier = Number(house.HouseTypeID.match(/\d+/)[0])
  const size = describeNodeSize(getGatherableNodeSizes()[tier])

  // `T${tier}`,
  // house.HouseTypeID
  const result: FilterGroup = {
    section: 'structures',
    sectionLabel: '',
    sectionIcon: svgHouse,

    category: 'houses',
    categoryLabel: 'Houses',

    subcategory: '',
    subcategoryLabel: '',

    labels: true,
    variantID: size.size,
    variantLabel: `T${tier}`,
    properties: {
      color: null,
      icon: null,
      label: `T${tier}`,
      size: size.scale * 2,
      title: humanize(house.HouseTypeID),
    },
  }

  return result
}

const STATION_ICONS = {
  Alchemy: '/assets/icons/worldmap/worldmap_alchemy.png',
  Blacksmith: '/assets/icons/worldmap/worldmap_blacksmith.png',
  Camp: null,
  Camp1_Standing: null,
  Carpentry: '/assets/icons/worldmap/worldmap_carpentry.png',
  Cooking: '/assets/icons/worldmap/worldmap_cooking.png',
  Engineering: '/assets/icons/worldmap/worldmap_engineering.png',
  FlameCore_Forge: '/assets/icons/worldmap/worldmap_kiln.png',
  GypsumStation: '/assets/icons/worldmap/worldmap_kiln.png',
  Masonry: '/assets/icons/worldmap/worldmap_masonry.png',
  Outfitting: '/assets/icons/worldmap/worldmap_outfitting.png',
  Smelting: '/assets/icons/worldmap/worldmap_smelter.png',
  Tanning: '/assets/icons/worldmap/worldmap_tannery.png',
  Weaving: '/assets/icons/worldmap/worldmap_weaving.png',
}

function describeStation(station: ScannedStation, tl8: TranslateService): FilterGroup {
  const name = stripHtml(tl8.get(station.name?.replace('@', '')))

  const result: FilterGroup = {
    section: 'structures',
    sectionLabel: '',
    sectionIcon: null,

    category: station.stationID,
    categoryLabel: name,
    categoryIcon: null,

    subcategory: '',
    subcategoryLabel: '',

    labels: true,
    properties: {
      color: null,
      icon: null,
      label: name,
      size: 2.5,

      title: name || station.stationID,
    },
  }

  if (station.stationID.match(/\d+/)) {
    const type = station.stationID.replace(/\d+/, '')
    const tier = Number(station.stationID.match(/\d+/)[0])
    const size = describeNodeSize(getGatherableNodeSizes()[tier])
    const icon = STATION_ICONS[type]
    result.category = station.stationID.replace(/\d+/, '')
    result.categoryLabel = result.category
    result.categoryIcon = icon
    result.variantID = size.size
    result.variantLabel = `T${tier}`
    result.properties.icon = icon
    result.properties.size = 2
    result.icons = true
  }

  return result
}

const STRUCTURE_ICONS = {
  Storage: '/assets/icons/worldmap/worldmap_storage.png',
  TradingPost: '/assets/icons/worldmap/worldmap_tradingpost.png',
  Warboard: '/assets/icons/worldmap/worldmap_warboard.png',
}

function describeStructure(structure: ScannedStructure, tl8: TranslateService): FilterGroup {
  const name = humanize(structure.type)
  const icon = STRUCTURE_ICONS[structure.type] || null
  const props: FilterGroup = {
    section: 'structures',
    sectionLabel: '',
    sectionIcon: null,

    category: structure.type,
    categoryLabel: name,
    categoryIcon: icon,

    subcategory: '',
    subcategoryLabel: '',

    labels: true,
    icons: true,
    properties: {
      color: null,
      icon: icon,
      label: name,
      size: 2,
      title: name,
    },
  }

  return props
}

function generateId(properties: FilterGroup) {
  return `s=${properties.section}&c=${properties.category}&s=${properties.subcategory}`
}

function appendVariant(data: FilterDataSet, group: FilterGroup) {
  if (!group?.variantID) {
    return
  }
  if (data.variants.some((it) => it.id === group.variantID)) {
    return
  }
  data.variants.push({
    id: group.variantID,
    label: group.variantLabel,
    icon: group.variantIcon,
    properties: group.properties,
  })
}

function stripHtml(html: string): string {
  let index = html.indexOf('<')
  while (index >= 0) {
    const end = html.indexOf('>', index)
    if (end < 0) {
      break
    }
    html = html.slice(0, index) + html.slice(end + 1)
    index = html.indexOf('<')
  }
  return html
}
