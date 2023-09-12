export interface Capital {
  Capitals: CapitalElement[]
}

export interface CapitalElement {
  cookie?: Cookie
  footprint: Footprint
  id: string
  params?: Params
  rotation: Tion
  scale?: number
  sliceAssetId: string
  sliceName: string
  variantName?: string
  worldPosition: Tion
}

export interface Cookie {
  edgeNoise?: number
  edgeNoiseFeatureSize?: number
  groundNoiseScale?: number
  innerRadius?: number
  maxHeightBlend: number
  outerRadius: number
}

export interface Footprint {
  height?: number
  id: string
  radius?: number
  type: Type
  width?: number
}

export type Type = 'AxisAlignedSquare' | 'Circle' | 'Rectangle'

export interface Params {
  CAPITAL_TYPE?: string
  COMPASS_ICON_PATH?: string
  FOOTPRINT_MESH_PATH?: string
  HAS_VEG_COMPONENTS?: string
  HAS_WATER_COMPONENTS?: string
  MAP_ICON_PATH?: string
  TERRITORY_DATA_ID?: string
  USER_FACE_NAME_LOC_KEY?: string
}

export interface Tion {
  w?: number
  x: number
  y: number
  z: number
}
