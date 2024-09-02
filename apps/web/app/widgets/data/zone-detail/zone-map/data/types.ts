import { Feature, FeatureCollection, MultiPoint, MultiPolygon, Polygon } from 'geojson'

export interface FilterDataSet extends FilterGroup {
  id: string
  count: number
  data: Record<
    string,
    {
      count: number
      geometry: FilterFeatureCollection
    }
  >
  variants: FilterVariant[]
}

export type FilterFeatureCollection = FeatureCollection<MultiPoint, FilterFeatureProperties>
export type FilterFeature = Feature<MultiPoint, FilterFeatureProperties>
export interface FilterGroup {
  icon: string
  color: string
  lootTable: string
  loreID: string

  section: string
  sectionLabel?: string
  sectionIcon?: string

  category: string
  categoryLabel?: string
  categoryIcon?: string

  subcategory: string
  subcategoryLabel?: string
  subcategoryIcon?: string

  encounter?: string
  vitalId?: string
  vitalLevel?: number
}

export interface FilterVariant {
  id: string
  label: string
  name: string
  color?: string
  icon?: string

  lootTable: string
}

export interface FilterFeatureProperties extends FilterGroup {
  icon: string
  color: string
  name: string
  size?: number
  variant?: string

  lootTable: string
}

export interface FilterDataPropertiesWithVariant extends Omit<FilterFeatureProperties, 'variant'> {
  variant: FilterVariant
}

//
// Vitals
//

export interface VitalDataSet {
  count: number
  data: Record<
    string,
    {
      count: number
      data: VitalsFeatureCollection
    }
  >
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
