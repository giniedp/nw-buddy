import { Feature, FeatureCollection, MultiPoint, MultiPolygon, Polygon } from 'geojson'

export interface FilterDataSet extends FilterGroup {
  id: string
  count: number
  data: Record<string, FilterMapData>
  variants: FilterVariant[]
}

export interface FilterMapData {
  count: number
  /**
   * Point count per variant id, points without a variant count under ''
   */
  variantCounts: Record<string, number>
  geometry: FilterFeatureCollection
}

export type FilterFeatureCollection = FeatureCollection<MultiPoint, FilterFeatureProperties>
export type FilterFeature = Feature<MultiPoint, FilterFeatureProperties>
export interface FilterGroup {
  section: string
  sectionLabel?: string | string[]
  sectionIcon?: string

  category: string
  categoryLabel?: string | string[]
  categoryIcon?: string
  categoryAffix?: string

  subcategory: string
  subcategoryLabel?: string | string[]
  subcategoryIcon?: string
  subcategoryAffix?: string

  variantID?: string
  variantLabel?: string
  variantIcon?: string

  labels?: boolean
  icons?: boolean

  properties: FilterFeatureProperties
}

export interface FilterVariant {
  id: string
  label: string
  icon: string
  properties: FilterFeatureProperties
}

export interface FilterFeatureProperties {
  // geometry rendering properties
  color: string
  icon: string
  label: string
  size: number
  iconSize?: number

  // data properties for tooltips and other logic
  title?: string
  subtitle?: string
  loreID?: string
  vitalID?: string
  vitalLevel?: number
  lootTableID?: string
  gatherableID?: string
  variationID?: string
  encounter?: string
  variant?: string
}

export interface FilterDataPropertiesWithVariant extends Omit<FilterFeatureProperties, 'variant'> {
  variant: FilterVariant
}

//
// Vitals
//

export interface VitalDataSet {
  count: number
  data: Record<string, VitalMapData>
}

export interface VitalMapData {
  count: number
  /**
   * Creatures on the map with their point counts
   */
  creatures: VitalCreature[]
  /**
   * Properties and point count per feature, for counting without building the GeoJSON
   */
  summary: Array<{ properties: VitalsFeatureProperties; count: number }>
  data: VitalsFeatureCollection
}

export interface VitalCreature {
  /**
   * Vitals id, lower case
   */
  id: string
  /**
   * Display name (translation key)
   */
  name: string
  /**
   * Creature type, lower case
   */
  type: string
  /**
   * Points on the map, one per spawn and level
   */
  count: number
  minLevel: number
  maxLevel: number
}

export type VitalsFeatureCollection = FeatureCollection<MultiPoint, VitalsFeatureProperties>
export type VitalsFeature = Feature<MultiPoint, VitalsFeatureProperties>
export interface VitalsFeatureProperties {
  id: string
  level: number
  type: string
  categories: string[]
  encounter: string[]
  lootTags: string[]
  poiTags: string[]
  color: string
}

export type HouseFeatureCollection = FeatureCollection<MultiPoint, HouseFeatureProperties>
export type HouseFeature = Feature<MultiPoint, HouseFeatureProperties>
export interface HouseFeatureProperties {
  id: string
  color: string
  label: string
  size: number
}
