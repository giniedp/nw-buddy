import { Feature, FeatureCollection, MultiPoint } from 'geojson'
import {
  FilterDataSet,
  FilterFeatureProperties,
  FilterGroup,
  FilterVariant,
  VitalCreature,
  VitalDataSet,
  VitalsFeatureProperties,
} from './types'

/**
 * A multi point feature with its positions as interleaved longitude, latitude pairs. Crosses the worker boundary
 * without cloning millions of small coordinate arrays
 */
export interface PackedFeature<P> {
  id: number
  properties: P
  positions: Float32Array
}

export interface PackedMapData<P> {
  count: number
  features: Array<PackedFeature<P>>
}

export interface PackedFilterDataSet extends FilterGroup {
  id: string
  count: number
  variants: FilterVariant[]
  data: Record<string, PackedMapData<FilterFeatureProperties>>
}

export interface PackedVitalDataSet {
  count: number
  data: Record<string, PackedVitalMapData>
}

export interface PackedVitalMapData extends PackedMapData<VitalsFeatureProperties> {
  creatures: VitalCreature[]
}

export function packPositions(points: number[]) {
  return Float32Array.from(points)
}

/**
 * Copies the features of one map, the copies go into the transfer list
 */
export function copyMapData<P>(data: PackedMapData<P>, transfer: Transferable[]): PackedMapData<P> {
  return {
    count: data.count,
    features: data.features.map((it) => {
      const positions = it.positions.slice()
      transfer.push(positions.buffer)
      return {
        id: it.id,
        properties: it.properties,
        positions,
      }
    }),
  }
}

export function toFeatureCollection<P>(features: Array<PackedFeature<P>>): FeatureCollection<MultiPoint, P> {
  return {
    type: 'FeatureCollection',
    features: features.map((it): Feature<MultiPoint, P> => {
      const coordinates: number[][] = new Array(it.positions.length / 2)
      for (let i = 0; i < coordinates.length; i++) {
        coordinates[i] = [it.positions[i * 2], it.positions[i * 2 + 1]]
      }
      return {
        id: it.id,
        type: 'Feature',
        properties: it.properties,
        geometry: {
          type: 'MultiPoint',
          coordinates,
        },
      }
    }),
  }
}

/**
 * The GeoJSON of a dataset is built on first access: only enabled layers need it
 */
export function unpackFilterDataSets(list: PackedFilterDataSet[]): FilterDataSet[] {
  return list.map((layer) => {
    const data: FilterDataSet['data'] = {}
    for (const mapId in layer.data) {
      const packed = layer.data[mapId]
      let geometry: FeatureCollection<MultiPoint, FilterFeatureProperties> = null
      const variantCounts: Record<string, number> = {}
      for (const feature of packed.features) {
        const variant = feature.properties.variant || ''
        variantCounts[variant] = (variantCounts[variant] || 0) + feature.positions.length / 2
      }
      data[mapId] = {
        count: packed.count,
        variantCounts,
        get geometry() {
          geometry ??= toFeatureCollection(packed.features)
          return geometry
        },
      }
    }
    return { ...layer, data }
  })
}

export function unpackVitalDataSet(packed: PackedVitalDataSet): VitalDataSet {
  const data: VitalDataSet['data'] = {}
  for (const mapId in packed.data) {
    const mapData = packed.data[mapId]
    let collection: FeatureCollection<MultiPoint, VitalsFeatureProperties> = null
    data[mapId] = {
      count: mapData.count,
      creatures: mapData.creatures,
      summary: mapData.features.map((it) => {
        return { properties: it.properties, count: it.positions.length / 2 }
      }),
      get data() {
        collection ??= toFeatureCollection(mapData.features)
        return collection
      },
    }
  }
  return { count: packed.count, data }
}
