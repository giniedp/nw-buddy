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

export interface AssetId {
  __type: string
  guid: string
  subid: number
}
export function isAssetId(obj: any): obj is AssetId {
  return obj?.['__type'] === 'AssetId'
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
