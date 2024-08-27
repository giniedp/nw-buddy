import { FeatureCollection, MultiPoint, Point } from 'geojson'

export interface FilterDataSet extends FilterDataGroup {
  id: string
  count: number
  data: Record<
    string,
    {
      count: number
      geometry: FeatureCollection<MultiPoint, FilterDataProperties>
    }
  >
  variants: FilterVariant[]
}

export interface FilterDataGroup {
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

export interface FilterDataProperties extends FilterDataGroup {
  icon: string
  color: string
  name: string
  size?: number
  variant?: string

  lootTable: string
}

export interface FilterDataPropertiesWithVariant extends Omit<FilterDataProperties, 'variant'> {
  variant: FilterVariant
}

export interface VitalDataSet {
  count: number
  data: Record<
    string,
    {
      count: number
      geometry: VitalDataGeometry
    }
  >
}

export type VitalDataGeometry = FeatureCollection<MultiPoint, VitalDataProperties>
export interface VitalDataProperties {
  id: string
  level: number
  type: string
  categories: string[]
  lootTags: string[]
  poiTags: string[]
  color: string
  encounter: string[]
}
