export interface AliasAsset {
  __type: string
  tags: Array<TagSlicesReference>
}
export function isAliasAsset(obj: any): obj is AliasAsset {
  return obj?.['__type'] === 'AliasAsset'
}

export interface TagSlicesReference {
  __type: string
  tag: number
  slices: Array<SlicePercentReference>
}
export function isTagSlicesReference(obj: any): obj is TagSlicesReference {
  return obj?.['__type'] === 'TagSlicesReference'
}

export interface SlicePercentReference {
  __type: string
  slice: Asset
  percent: number
  schedule: $$3b429139_bf67_557b_b347_d0a61d4f47b1
}
export function isSlicePercentReference(obj: any): obj is SlicePercentReference {
  return obj?.['__type'] === 'SlicePercentReference'
}

export interface Asset {
  __type: string
  guid: string
  subId: string
  type: string
  hint: string
}
export function isAsset(obj: any): obj is Asset {
  return obj?.['__type'] === 'Asset'
}

export interface $$3b429139_bf67_557b_b347_d0a61d4f47b1 {
  __type: string
}
export function is$$3b429139_bf67_557b_b347_d0a61d4f47b1(obj: any): obj is $$3b429139_bf67_557b_b347_d0a61d4f47b1 {
  return obj?.['__type'] === '3b429139-bf67-557b-b347-d0a61d4f47b1'
}
