import { GatherableVariation, NW_FALLBACK_ICON } from '@nw-data/common'
import { GatherableData } from '@nw-data/generated'
import { ScannedGatherable, ScannedVariation } from '@nw-data/scanner'
import { FeatureCollection, MultiPoint } from 'geojson'
import { combineLatest, map, switchMap } from 'rxjs'
import tinycolor from 'tinycolor2'
import { NwDataService } from '~/data'
import { combineLatestOrEmpty, eqCaseInsensitive, humanize, stringToColor } from '~/utils'
import { getGatherableIcon, getTradeskillIcon } from '../../../gatherable-detail/utils'

export interface GatherableDataSet extends GatherableGroup {
  id: string
  count: number
  data: Record<
    string,
    {
      count: number
      geometry: FeatureCollection<MultiPoint, GatherableProperties>
    }
  >
  variants: GatherableVariant[]
}

export interface GatherableGroup {
  icon: string
  color: string
  lootTable: string

  section: string
  sectionLabel?: string
  sectionIcon?: string

  category: string
  categoryLabel?: string
  categoryIcon?: string

  subcategory: string
  subcategoryLabel?: string
  subcategoryIcon?: string

  isRandom?: boolean
}

export interface GatherableVariant {
  id: string
  label: string
  color?: string
  icon?: string
}

export interface GatherableProperties extends GatherableGroup {
  icon: string
  color: string
  name: string
  size?: number
  variant?: string

  lootTable: string
}

export interface GatherablePropertiesWithVariant extends Omit<GatherableProperties, 'variant'> {
  variant: GatherableVariant
}

export type MapCoord = (coord: number[] | [number, number]) => number[]
export function loadGatherables(db: NwDataService, mapCoord: MapCoord) {
  return combineLatest({
    gatherables: db.gatherables,
    gatherablesMeta: db.gatherablesMetadataMap,
    variationsByGatherableId: db.gatherableVariationsByGatherableIdMap,
    variationsMeta: db.variationsMetadataMap,
    chunks: loadAllChunks(db),
  }).pipe(
    map((data) =>
      collectGatherableDatasets({
        ...data,
        mapCoord,
      }),
    ),
  )
}

function loadAllChunks(db: NwDataService) {
  return db.variationsMetadata.pipe(
    switchMap((list) => {
      const chunkIds: number[] = []
      for (const item of list) {
        for (const spawn of item.spawns) {
          if (!chunkIds.includes(spawn.positions.chunkID)) {
            chunkIds.push(spawn.positions.chunkID)
          }
        }
      }
      return combineLatestOrEmpty(chunkIds.map((id) => db.variationsChunk(id)))
    }),
  )
}
function collectGatherableDatasets(data: {
  gatherables: GatherableData[]
  gatherablesMeta: Map<string, ScannedGatherable>
  variationsByGatherableId: Map<string, GatherableVariation[]>
  variationsMeta: Map<string, ScannedVariation>
  chunks: Array<number[][]>
  mapCoord: MapCoord
}): GatherableDataSet[] {
  const result: Record<string, GatherableDataSet> = {}
  for (const gatherable of data.gatherables) {
    const meta = data.gatherablesMeta.get(gatherable.GatherableID)
    const variations = data.variationsByGatherableId.get(gatherable.GatherableID)

    if (meta?.spawns?.length) {
      for (const spawn of meta.spawns) {
        const properties = describeGatherable(gatherable, gatherable.FinalLootTable)
        const groupId = generateId(properties)
        const id = `${groupId}&r=${!!spawn.randomEncounter}`
        properties.color = properties.color || stringToColor(groupId)
        properties.isRandom = spawn.randomEncounter
        if (properties.variant) {
          properties.variant.color = sizeColor(properties.variant.id, properties.color)
        }
        const layer = (result[id] = result[id] || {
          id,
          ...properties,
          variants: [],
          data: {},
          count: 0,
        })

        appendVariant(layer, properties.variant)

        const mapId = spawn.mapID
        const points = spawn.positions.map(data.mapCoord)
        const mapData = (layer.data[mapId] = layer.data[mapId] || {
          count: 0,
          geometry: {
            type: 'FeatureCollection',
            features: [],
          },
        })
        layer.count += points.length
        mapData.count += points.length
        mapData.geometry.features.push({
          type: 'Feature',
          properties: {
            ...properties,
            variant: properties.variant?.id,
            color: properties.variant?.color || properties.color,
          },
          geometry: {
            type: 'MultiPoint',
            coordinates: points,
          },
        })
      }
    }

    if (variations) {
      for (const variant of variations) {
        const meta = data.variationsMeta.get(variant.VariantID)
        if (!meta?.spawns?.length || !variant.Gatherables?.length) {
          continue
        }
        const found = variant.Gatherables.find((it) => eqCaseInsensitive(it.GatherableID, gatherable.GatherableID))
        let lootTables = found.LootTable
        if (lootTables.length === 0) {
          lootTables = [gatherable.FinalLootTable]
        }
        for (const lootTable of lootTables) {
          for (const spawn of meta.spawns) {
            const properties = describeGatherable(gatherable, lootTable, variant)
            const groupId = generateId(properties)
            const id = `${groupId}&r=${!!spawn.randomEncounter}`
            properties.color = properties.color || stringToColor(groupId)
            properties.isRandom = spawn.randomEncounter
            if (properties.variant) {
              properties.variant.color = sizeColor(properties.variant.id, properties.color)
            }
            const layer = (result[id] = result[id] || {
              id,
              ...properties,
              variants: [],
              data: {},
              count: 0,
            })
            appendVariant(layer, properties.variant)

            const mapId = spawn.mapID
            const mapData = (layer.data[mapId] = layer.data[mapId] || {
              count: 0,
              geometry: {
                type: 'FeatureCollection',
                features: [],
              },
            })
            const chunk = spawn.positions
            const points = data.chunks[chunk.chunkID]
              .slice(chunk.elementOffset, chunk.elementOffset + chunk.elementCount)
              .map(data.mapCoord)
            layer.count += points.length
            mapData.count += points.length
            mapData.geometry.features.push({
              type: 'Feature',
              properties: {
                ...properties,
                variant: properties.variant?.id,
                color: properties.variant?.color || properties.color,
              },
              geometry: {
                type: 'MultiPoint',
                coordinates: points,
              },
            })
          }
        }
      }
    }
  }
  return Object.values(result)
}

const CREATURES = [
  'Alligator',
  'Bear',
  'Beast',
  'Bison',
  'Brute',
  'Cat',
  'Creature',
  'Elk',
  'Panther',
  'Rat',
  'Scarab',
  'Scorpion',
  'Wolf',
]

function describeGatherable(
  gatherable: GatherableData,
  lootTableId: string,
  variant?: GatherableVariation,
): GatherablePropertiesWithVariant {
  const lootTable = inspectLootTable(lootTableId)
  const icon = getGatherableIcon(gatherable)

  const props: GatherablePropertiesWithVariant = {
    icon: icon,
    name: gatherable.DisplayName,
    color: null,
    lootTable: lootTable.original,

    section: gatherable.Tradeskill,
    sectionIcon: getTradeskillIcon(gatherable.Tradeskill) || NW_FALLBACK_ICON,
    category: lootTableId,
    categoryIcon: icon,
    subcategory: '',

    variant: null,
  }

  {
    const match = lootTable.normalized.match(/(Air|Death|Earth|Fire|Life|Soul|Water)(_)?(Boid|Plant|Stone)/)
    if (match) {
      props.section = 'Essences'
      props.sectionLabel = 'Essences'
      props.sectionIcon = NW_FALLBACK_ICON
      props.category = match[1]
      props.categoryLabel = match[1]
      props.variant = {
        id: match[3],
        label: match[3],
        icon: getGatherableIcon(gatherable),
      }
      return props
    }
  }

  {
    const result = describeDungeon(lootTable, gatherable, variant)
    if (result) {
      return result
    }
  }

  {
    const result = describeChests(lootTable, gatherable, variant)
    if (result) {
      return result
    }
  }

  {
    const result = describeMining(lootTable, gatherable, variant)
    if (result) {
      return result
    }
  }

  {
    const result = describeLogging(lootTable, gatherable, variant)
    if (result) {
      return result
    }
  }

  {
    const result = describeHarvesting(lootTable, gatherable, variant)
    if (result) {
      return result
    }
  }

  {
    const result = describeSkinning(lootTable, gatherable, variant)
    if (result) {
      return result
    }
  }

  if (eqCaseInsensitive(lootTable.normalized, 'empty')) {
    props.section = '_Empty'
    props.sectionLabel = 'No Loottable'
    props.category = gatherable.DisplayName || gatherable.GatherableID
    props.categoryLabel = gatherable.DisplayName
    if (variant) {
      props.subcategory = variant.VariantID
      props.subcategoryLabel = variant.Name || variant.VariantID
    } else {
      props.subcategory = gatherable.GatherableID
      props.subcategoryLabel = gatherable.DisplayName
    }
    return props
  }

  if (eqCaseInsensitive(gatherable.Tradeskill, 'none')) {
    props.section = '_None'
    props.sectionLabel = 'No Tradeskill'
    // props.category = 'Empty'
    // props.categoryLabel = 'Empty'
    props.subcategory = variant?.VariantID || ''
    props.subcategoryLabel = variant?.Name || ''
    return props
  }
  {
    const found = matchSize(lootTable)
    if (found) {
      props.category = lootTable.normalized.replace(found.size, '')
      props.size = found.scale
      props.variant = {
        id: found.size,
        label: found.label,
      }
      return props
    }
  }

  return props
}

function generateId(properties: GatherableGroup) {
  return `s=${properties.section}&c=${properties.category}&s=${properties.subcategory}`
}

type LootTable = ReturnType<typeof inspectLootTable>
function inspectLootTable(value: string) {
  const original = value || 'Empty'
  const normalized = original
    .split(/[_]/)
    .filter((it) => it.length > 0)
    .map((it) => it[0].toUpperCase() + it.substring(1))
    .join('')
  const tokenized = normalized.split(/(?<![A-Z])(?=[A-Z])/)
  return {
    original,
    normalized,
    tokenized,
  }
}

const SIZE_LABELS = {
  Huge: 'XL',
  Large: 'LG',
  Medium: 'MD',
  Small: 'SM',
  Tiny: 'XS',
  XSmall: 'XXS',
}
const SIZE_SCALE = {
  Huge: 1.5,
  Large: 1.25,
  Medium: 1,
  Small: 0.75,
  Tiny: 0.5,
  XSmall: 0.5,
}
const SIZE_ZINDEX = {
  Huge: 1,
  Large: 2,
  Medium: 3,
  Small: 4,
  Tiny: 5,
  XSmall: 6,
}
function matchSize({ tokenized }: LootTable) {
  for (const size in SIZE_LABELS) {
    if (tokenized.includes(size)) {
      return {
        size,
        label: SIZE_LABELS[size],
        scale: SIZE_SCALE[size],
        zindex: SIZE_ZINDEX[size],
      }
    }
  }
  return null
}

function appendVariant(data: GatherableDataSet, variant: GatherableVariant) {
  if (!variant) {
    return
  }
  if (data.variants.some((it) => it.id === variant.id)) {
    return
  }
  data.variants.push(variant)
}

function sizeColor(sizeType: string, color: string) {
  if (!color || !sizeType || !SIZE_SCALE[sizeType]) {
    return color
  }
  const min = SIZE_SCALE.Tiny
  const max = SIZE_SCALE.Huge
  const scale = SIZE_SCALE[sizeType] / (max - min)
  const hsl = tinycolor(color).toHsl()
  return tinycolor({
    ...hsl,
    l: lerp(0.8, 0.4, scale),
  }).toHexString()
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function describeDungeon(
  lootTable: LootTable,
  gatherable: GatherableData,
  variant?: GatherableVariation,
): GatherablePropertiesWithVariant {
  if (lootTable.tokenized[0] !== 'Dungeon') {
    return null
  }
  const match = lootTable.normalized.match(
    /^(Dungeon)(CutlassKeys00|Edengrove|Everfall00|RestlessShores01|ShatterMtn00)(.*)/i,
  )
  if (!match) {
    return null
  }

  const props: GatherablePropertiesWithVariant = {
    name: gatherable.DisplayName,
    color: null,
    icon: null,
    variant: null,
    lootTable: lootTable.original,

    section: lootTable.tokenized[0],
    sectionLabel: lootTable.tokenized[0],
    sectionIcon: NW_FALLBACK_ICON,

    category: match[2],
    categoryLabel: humanize(match[2]),

    subcategory: match[3],
    subcategoryLabel: humanize(match[3]),
  }

  return props
}

const CHESTS = ['Chest', 'Chests', 'Sarcophagi', 'Loot', 'Container']
function describeChests(
  lootTable: LootTable,
  gatherable: GatherableData,
  variant?: GatherableVariation,
): GatherablePropertiesWithVariant {
  if (!CHESTS.some((it) => lootTable.tokenized.includes(it))) {
    return null
  }

  const name = variant?.Name || gatherable.DisplayName || ''
  const props: GatherablePropertiesWithVariant = {
    name,
    color: null,
    icon: null,
    variant: null,
    lootTable: lootTable.original,

    section: 'Chests',
    sectionLabel: 'Chests',
    sectionIcon: NW_FALLBACK_ICON,

    category: lootTable.original,
    categoryLabel: humanize(lootTable.original),

    subcategory: '',
    subcategoryLabel: '',
  }

  if (lootTable.tokenized.includes('Beach')) {
    props.category = 'Beach'
    props.categoryLabel = 'Starter Beach'
    props.subcategory = lootTable.normalized
    props.subcategoryLabel = lootTable.tokenized.filter((it) => it !== 'Beach' && it !== 'Chest').join(' ')
  } else if (variant) {
    props.category = lootTable.original
    props.categoryLabel = lootTable.tokenized.filter((it) => !CHESTS.includes(it)).join(' ')
    props.subcategory = variant.VariantID
    props.subcategoryLabel = variant.Name
  }

  return props
}

function describeMining(
  lootTable: LootTable,
  gatherable: GatherableData,
  variant?: GatherableVariation,
): GatherablePropertiesWithVariant {
  if (gatherable.Tradeskill !== 'Mining') {
    return null
  }
  const name = variant?.Name || gatherable.DisplayName || ''
  const props: GatherablePropertiesWithVariant = {
    name,
    color: null,
    icon: null,
    variant: null,
    lootTable: lootTable.original,

    section: gatherable.Tradeskill,
    sectionLabel: gatherable.Tradeskill,
    sectionIcon: getTradeskillIcon(gatherable.Tradeskill),

    category: lootTable.original,
    categoryLabel: humanize(lootTable.original),
    categoryIcon: getGatherableIcon(gatherable),

    subcategory: '',
    subcategoryLabel: '',
  }

  const size = matchSize(lootTable)
  if (size) {
    props.category = lootTable.tokenized.filter((it) => it !== size.size).join(' ')
    props.categoryLabel = lootTable.tokenized
      .filter((it) => it !== size.size && it !== 'Vein' && it !== 'Finish')
      .join(' ')
    props.size = size.scale
    props.variant = {
      id: size.size,
      label: size.label,
    }
  }

  const creature = CREATURES.find((it) => lootTable.tokenized.includes(it))
  if (creature) {
    props.category = 'Creature'
    props.categoryLabel = 'Creature'
    props.categoryIcon = null
    props.subcategory = creature
    props.subcategoryLabel = creature
    props.subcategoryIcon = null
  }

  return props
}

function describeLogging(
  lootTable: LootTable,
  gatherable: GatherableData,
  variant?: GatherableVariation,
): GatherablePropertiesWithVariant {
  if (gatherable.Tradeskill !== 'Logging') {
    return null
  }
  const name = variant?.Name || gatherable.DisplayName || ''
  const props: GatherablePropertiesWithVariant = {
    name,
    color: null,
    icon: null,
    variant: null,
    lootTable: lootTable.original,

    section: gatherable.Tradeskill,
    sectionLabel: gatherable.Tradeskill,
    sectionIcon: getTradeskillIcon(gatherable.Tradeskill),

    category: lootTable.original,
    categoryLabel: humanize(lootTable.original),
    categoryIcon: getGatherableIcon(gatherable),

    subcategory: '',
    subcategoryLabel: '',
  }

  const size = matchSize(lootTable)
  if (size) {
    props.category = lootTable.tokenized.filter((it) => it !== size.size).join(' ')
    props.categoryLabel = lootTable.tokenized
      .filter((it) => it !== size.size && it !== 'Vein' && it !== 'Finish')
      .join(' ')
    props.size = size.scale
    props.variant = {
      id: size.size,
      label: size.label,
    }
  }

  const creature = CREATURES.find((it) => lootTable.tokenized.includes(it))
  if (creature) {
    props.category = 'Creature'
    props.categoryLabel = 'Creature'
    props.categoryIcon = null
    props.subcategory = creature
    props.subcategoryLabel = creature
    props.subcategoryIcon = null
  }

  return props
}

function describeHarvesting(
  lootTable: LootTable,
  gatherable: GatherableData,
  variant?: GatherableVariation,
): GatherablePropertiesWithVariant {
  if (gatherable.Tradeskill !== 'Harvesting') {
    return null
  }
  const name = variant?.Name || gatherable.DisplayName || ''
  const props: GatherablePropertiesWithVariant = {
    name,
    color: null,
    icon: null,
    variant: null,
    lootTable: lootTable.original,

    section: gatherable.Tradeskill,
    sectionLabel: gatherable.Tradeskill,
    sectionIcon: getTradeskillIcon(gatherable.Tradeskill),

    category: lootTable.original,
    categoryLabel: humanize(lootTable.original),
    categoryIcon: getGatherableIcon(gatherable),

    subcategory: '',
    subcategoryLabel: '',
  }

  if (lootTable.normalized.endsWith('SporePod')) {
    props.category = 'SporePod'
    props.categoryLabel = 'Spore Pod'
    props.subcategory = lootTable.normalized.replace('SporePod', '')
    props.subcategoryLabel = humanize(props.subcategory)
    props.variant = null
    return props
  }

  if (lootTable.tokenized.includes('Dye') || lootTable.tokenized.includes('Pigment')) {
    props.category = 'Dye'
    props.categoryLabel = 'Dye & Pigment'
    props.subcategory = lootTable.original //
    props.subcategoryLabel = lootTable.tokenized.filter((it) => it !== 'Plant').join(' ')
    props.variant = null
    const colorName = lootTable.tokenized.filter((it) => it !== 'Plant' && it !== 'Dye' && it !== 'Pigment').join('')
    const colors = {
      DesertRose: '#FFC0CB',
      DarkPurple: '#800080',
    }
    const tc = tinycolor(colorName)
    if (tc.isValid()) {
      props.color = tc.toHexString()
    } else if (colors[colorName]) {
      props.color = colors[colorName]
    } else {
      console.warn('Invalid color', colorName)
    }
    return props
  }

  const size = matchSize(lootTable)
  if (size) {
    props.category = lootTable.tokenized.filter((it) => it !== size.size).join(' ')
    props.categoryLabel = humanize(props.category)
    props.size = size.scale
    props.variant = {
      id: size.size,
      label: size.label,
    }
  }

  return props
}

function describeSkinning(
  lootTable: LootTable,
  gatherable: GatherableData,
  variant?: GatherableVariation,
): GatherablePropertiesWithVariant {
  if (gatherable.Tradeskill !== 'Skinning') {
    return null
  }
  const name = variant?.Name || gatherable.DisplayName || ''
  const icon = getGatherableIcon(gatherable)
  const props: GatherablePropertiesWithVariant = {
    name,
    color: null,
    icon: icon,
    variant: null,
    lootTable: lootTable.original,

    section: gatherable.Tradeskill,
    sectionLabel: gatherable.Tradeskill,
    sectionIcon: getTradeskillIcon(gatherable.Tradeskill),

    category: lootTable.original,
    categoryLabel: lootTable.tokenized.filter((it) => it !== 'Skinning' && it !== 'Farm').join(' '),
    categoryIcon: icon,

    subcategory: '',
    subcategoryLabel: '',
  }

  const size = matchSize(lootTable)
  if (size) {
    props.category = lootTable.tokenized
      .filter((it) => it !== 'Skinning' && it !== 'Farm' && it !== size.size)
      .join(' ')
    props.categoryLabel = humanize(props.category)
    props.size = size.scale
    props.variant = {
      id: size.size,
      label: size.label,
    }
  }

  return props
}
