
export interface CapitalsDocument {
  Capitals: Array<{
    id: string
    worldPosition: { x: number; y: number; z: number }
    rotation: { x: number; y: number; z: number; w: number }
    sliceName: string
    sliceAssetId: string
  }>
}

export interface AZEntity<T> {
  __type: 'AZ::Entity'
  components: Array<T>
}
export type EntityWithSpawner = AZEntity<AIVariantProviderComponent | PointSpawnerComponent>
export interface AIVariantProviderComponent {
  __type: 'AIVariantProviderComponent'
  baseclass1: {
    __type: 'FacetedComponent'
    m_serverfacetptr: {
      __type: 'AIVariantProviderComponentServerFacet'
      m_vitalslevel: number
      m_vitalstableid: string
      m_vitalstablerowid: string
      m_vitalscategorytableid: string
      m_vitalscategorytablerowid: string
    }
  }
}
export interface PointSpawnerComponent {
  __type: 'PointSpawnerComponent'
  baseclass1: {
    __type: 'PrefabSpawnerComponent'
    m_sliceasset: {
      hint?: string
    }
    m_aliasasset: {
      hint?: string
    }
  }
}

export interface CharacterDocument {
  __type: 'AZ::Entity'
  name: string
  components: Array<VitalsComponent | ActionListComponent>
}
export interface VitalsComponent {
  __type: 'VitalsComponent'
  m_rowreference: string
}
export interface ActionListComponent {
  __type: 'ActionListComponent'
  m_damagetable: {
    __type: 'SpringboardDataSheetContainer'
    asset: {
      __type: string
      baseclass1: {
        __type: 'SimpleAssetReferenceBase'
        assetpath: string
      }
    }
  }
}

export interface RegionMetadataAsset {
  __type: 'RegionMetadataAsset'
  aispawnlocations: Array<{
    __type: 'AISpawnLocation'
    vitalsid: {
      __type: 'Crc32'
      value: number
    }
    vitalscategoryid: {
      __type: 'Crc32'
      value: number
    }
    vitalslevel: number
    worldposition: [number, number, number]
    spawnedbycoatlicue: boolean
    isalias: boolean
    isoverride: boolean
    isencounter: boolean
  }>
}

export interface SpawnDefinition {
  __type: 'SpawnDefinition'
  m_sliceasset: Asset
  m_aliasasset: Asset
}
export interface Asset {
  __type: "Asset",
  hint?: string
}

export function isVitalsComponent(it: any): it is VitalsComponent {
  return (it as VitalsComponent)?.__type === 'VitalsComponent'
}
export function isActionListComponent(it: any): it is ActionListComponent {
  return (it as ActionListComponent)?.__type === 'ActionListComponent'
}
export function isSpawnDefinition(it: any): it is SpawnDefinition {
  return (it as SpawnDefinition)?.__type === 'SpawnDefinition'
}
export function isRegionMetadataAsset(it: any): it is RegionMetadataAsset {
  return (it as RegionMetadataAsset)?.__type === 'RegionMetadataAsset'
}
export function isAsset(it: any): it is Asset {
  return (it as Asset)?.__type === 'Asset'
}
