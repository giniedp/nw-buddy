import { describeNodeSize, getGatherableNodeSizes } from '@nw-data/common'
import { NwData } from '@nw-data/db'
import { HouseTypeData } from '@nw-data/generated'
import { ScannedStation, ScannedStructure } from '@nw-data/generated'
import { groupBy } from 'lodash'
import { combineLatest, map } from 'rxjs'
import { TranslateService } from '~/i18n'
import { svgBoxesStacked, svgHammer, svgHouse } from '~/ui/icons/svg'
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
      const append = (layerId: string, group: FilterGroup, mapId: string, positions: Array<[number, number]>) => {
        const properties = group.properties
        properties.color ||= stringToHSL(generateId(group)).toHexString()
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

        const points = positions.map((it) => mapCoord(it))
        const mapData = (layer.data[mapId] = layer.data[mapId] || {
          count: 0,
          variantCounts: {},
          geometry: {
            type: 'FeatureCollection',
            features: [],
          },
        })
        const variant = properties.variant || ''
        layer.count += points.length
        mapData.count += points.length
        mapData.variantCounts[variant] = (mapData.variantCounts[variant] || 0) + points.length
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

      for (const houseType of houseTypes) {
        const meta = metaMap.get(houseType.HouseTypeID)
        if (!meta) {
          continue
        }
        const groups = groupBy(meta.houses, (it) => it.mapID)
        for (const [mapId, houses] of Object.entries(groups)) {
          const group = describeHouse(houseType)
          append(
            `house-${generateId(group)}`,
            group,
            mapId,
            houses.map((it) => it.position),
          )
        }
      }

      for (const row of stations) {
        const groups = groupBy(row.stations, (it) => [it.mapID, it.stationID])
        for (const stations of Object.values(groups)) {
          const group = describeStation(stations[0], tl8)
          append(
            `station-${generateId(group)}`,
            group,
            stations[0].mapID,
            stations.map((it) => it.position),
          )
        }
      }

      for (const row of structures) {
        const groups = groupBy(row.structures, (it) => [it.mapID, it.type])
        for (const structures of Object.values(groups)) {
          const group = describeStructure(structures[0])
          append(
            `station-${generateId(group)}`,
            group,
            structures[0].mapID,
            structures.map((it) => it.position),
          )
        }
      }
      return Object.values(result)
    }),
  )
}

const HOUSE_ICON = '/assets/icons/worldmap/worldmap_propertytax.png'

function describeHouse(house: HouseTypeData): FilterGroup {
  const tier = Number(house.HouseTypeID.match(/\d+/)[0])
  const size = describeNodeSize(getGatherableNodeSizes()[tier])
  const result: FilterGroup = {
    section: 'houses',
    sectionLabel: 'Houses',
    sectionIcon: svgHouse,

    category: 'houses',
    categoryLabel: 'Houses',
    categoryIcon: HOUSE_ICON,

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

const STATION_ICONS: Record<string, string> = {
  Alchemy: '/assets/icons/worldmap/worldmap_alchemy.png',
  Blacksmith: '/assets/icons/worldmap/worldmap_blacksmith.png',
  Camp: '/assets/icons/worldmap/filter_inns.png',
  Camp1_Standing: '/assets/icons/worldmap/filter_inns.png',
  Carpentry: '/assets/icons/worldmap/worldmap_carpentry.png',
  Cooking: '/assets/icons/worldmap/worldmap_cooking.png',
  Engineering: '/assets/icons/worldmap/worldmap_engineering.png',
  FlameCore_Forge: '/assets/icons/worldmap/worldmap_kiln.png',
  GypsumStation: '/assets/icons/worldmap/worldmap_kiln.png',
  Lightshield_AlchemyT: '/assets/icons/worldmap/worldmap_alchemy.png',
  Masonry: '/assets/icons/worldmap/worldmap_masonry.png',
  Outfitting: '/assets/icons/worldmap/worldmap_outfitting.png',
  RuneglassStation: '/assets/icons/worldmap/worldmap_kiln.png',
  Smelting: '/assets/icons/worldmap/worldmap_smelter.png',
  Specialty_DoubloonShop: '/assets/icons/worldmap/worldmap_npc.png',
  Specialty_ReekwaterShop: '/assets/icons/worldmap/worldmap_npc.png',
  Tanning: '/assets/icons/worldmap/worldmap_tannery.png',
  Weaving: '/assets/icons/worldmap/worldmap_weaving.png',
}

function describeStation(station: ScannedStation, tl8: TranslateService): FilterGroup {
  const name = stripHtml(tl8.get(station.name?.replace('@', '')))
  const icon = STATION_ICONS[station.stationID] || null
  const result: FilterGroup = {
    section: 'stations',
    sectionLabel: 'Crafting Stations',
    sectionIcon: svgHammer,

    category: station.stationID,
    categoryLabel: name,
    categoryIcon: icon,

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
    const icon = STATION_ICONS[type] || null
    result.category = type
    result.categoryLabel = humanize(type)
    result.categoryIcon = icon
    result.variantID = size.size
    result.variantLabel = `T${tier}`
    result.properties.icon = icon
    result.properties.size = 2
    result.icons = !!icon
  }

  return result
}

const STRUCTURE_ICONS: Record<string, string> = {
  Storage: '/assets/icons/worldmap/worldmap_storage.png',
  TradingPost: '/assets/icons/worldmap/worldmap_tradingpost.png',
  Warboard: '/assets/icons/worldmap/worldmap_warboard.png',
}

function describeStructure(structure: ScannedStructure): FilterGroup {
  const name = humanize(structure.type)
  const icon = STRUCTURE_ICONS[structure.type] || null
  const props: FilterGroup = {
    section: 'settlement',
    sectionLabel: 'Settlement',
    sectionIcon: svgBoxesStacked,

    category: structure.type,
    categoryLabel: name,
    categoryIcon: icon,

    subcategory: '',
    subcategoryLabel: '',

    labels: true,
    icons: !!icon,
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
