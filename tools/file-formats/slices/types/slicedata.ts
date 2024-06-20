export interface RegionSliceDataLookup {
  __type: string
  slicemetadatamap: Array<db52aacf_0a06_572d_8dc2_a36c84fe19c6>
}
export function isRegionSliceDataLookup(obj: any): obj is RegionSliceDataLookup {
  return obj?.['__type'] === 'RegionSliceDataLookup'
}

export interface db52aacf_0a06_572d_8dc2_a36c84fe19c6 {
  __type: string
  value1: SliceDataEntryKey
  value2: SliceMetaData
}
export function isdb52aacf_0a06_572d_8dc2_a36c84fe19c6(obj: any): obj is db52aacf_0a06_572d_8dc2_a36c84fe19c6 {
  return obj?.['__type'] === 'db52aacf-0a06-572d-8dc2-a36c84fe19c6'
}

export interface SliceDataEntryKey {
  __type: string
  slicename: string
  variantname: string
}
export function isSliceDataEntryKey(obj: any): obj is SliceDataEntryKey {
  return obj?.['__type'] === 'SliceDataEntryKey'
}

export interface SliceMetaData {
  __type: string
  gdespawnradius: number
  gridregistrationradius: number
  aoidistance: number
  slicephysicalradius: number
  '0xce429160': number
  isstaticslice: boolean
  hascollision: boolean
  isrequiredonserver: boolean
  skipmidrangeimpostors: boolean
  forcewaitreplicateddata: boolean
  islongdistancegde: boolean
  meshoptionsbitset: number
  slicetags: number
  meshes: Array<SliceMetaDataMeshEntry>
  spawners: Array<SliceMetaDataSpawnerEntry>
  spawnininstances: boolean
  '0xbf63d32c': boolean
  usescustomdefinedspawnradius: boolean
}
export function isSliceMetaData(obj: any): obj is SliceMetaData {
  return obj?.['__type'] === 'SliceMetaData'
}

export interface SliceMetaDataMeshEntry {
  __type: string
  meshassetid: AssetId
  materialoverrideassetid: AssetId
  size: number
  maxviewdistance: number
  m_impostorfardistance: boolean
  rootrelativetransform: Transform
  meshoptionsbitset: number
  lodratio: number
}
export function isSliceMetaDataMeshEntry(obj: any): obj is SliceMetaDataMeshEntry {
  return obj?.['__type'] === 'SliceMetaDataMeshEntry'
}

export interface AssetId {
  __type: string
  guid: string
  subid: number
}
export function isAssetId(obj: any): obj is AssetId {
  return obj?.['__type'] === 'AssetId'
}

export interface Transform {
  __type: string
  __value: unknown
}
export function isTransform(obj: any): obj is Transform {
  return obj?.['__type'] === 'Transform'
}

export interface $undefined {
  'rotation/scale': Array<number>
  translation: Array<number>
}
export function is$undefined(obj: any): obj is $undefined {
  return obj?.['__type'] === 'undefined'
}

export interface SliceMetaDataSpawnerEntry {
  __type: string
  worldtm: Transform
  sliceassetid: AssetId
  slicename: string
  variationname: string
  prefabpersists: boolean
  maxrotationangle: number
}
export function isSliceMetaDataSpawnerEntry(obj: any): obj is SliceMetaDataSpawnerEntry {
  return obj?.['__type'] === 'SliceMetaDataSpawnerEntry'
}
