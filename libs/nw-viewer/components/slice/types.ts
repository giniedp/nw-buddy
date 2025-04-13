export interface AzEntity {
  __type: 'AZ::Entity'
  id: AzEntityId
  name: string
  components: AzVector<AzComponent>
}

export interface AzVector<T> {
  __type: 'AZStd::vector'
  element: T | T[]
}

export interface AzComponent {
  __type: string
}

export interface AzEntityId {
  __type: 'EntityId'
  id: number
}

export interface AzSliceComponent {
  __type: 'SliceComponent'
  entities: AzVector<AzEntity>
}

export function azVectorElements<T>(vector: AzVector<T>): T[] {
  return Array.isArray(vector.element) ? vector.element : [vector.element]
}

export function azEntityComponents(entity: AzEntity): AzComponent[] {
  return azVectorElements(entity.components)
}

export function isAzEntity(entity: any): entity is AzEntity {
  return entity && entity.__type === 'AZ::Entity'
}

export function isAzSliceComponent(component: AzComponent): component is AzSliceComponent {
  return component && component.__type === 'SliceComponent'
}

export function getSliceComponent(entity: AzEntity): AzSliceComponent | undefined {
  const components = azEntityComponents(entity)
  return components.find(isAzSliceComponent) as AzSliceComponent | undefined
}

export interface AzAsset {
  guid: string
  subid: string
  type: string
  hint: string
}

export interface AzGameTransformComponent {
  __type: 'GameTransformComponent'
  baseclass1: unknown
  m_worldtm: AzTransform
  m_parentid: AzEntityId
  m_localtm: AzTransform
  m_onnewparentkeepworldtm: boolean
  m_isstatic: boolean
}

export function isAzGameTransformComponent(component: AzComponent): component is AzGameTransformComponent {
  return component && component.__type === 'GameTransformComponent'
}

export interface AzInstancedMeshComponent {
  __type: 'InstancedMeshComponent'
  'instanced mesh render node': AzInstancedMeshComponentRenderNode
}

export interface AzInstancedMeshComponentRenderNode {
  __type: 'InstancedMeshComponentRenderNode'
  'instance transforms': AzVector<AzTransform>
  baseclass1: AzMeshComponentRenderNode
}
export interface AzMeshComponentRenderNode {
  __type: 'MeshComponentRenderNode'
  visible: boolean
  'render options': Record<string, any>
  'static mesh': AzAsset
  'material overcoat asset': AzAsset
  'material override asset': AzAsset
}

export interface AzTransform {
  data: number[]
}

export function isAzInstancedMeshComponent(component: AzComponent): component is AzInstancedMeshComponent {
  return component && component.__type === 'InstancedMeshComponent'
}

export interface AzMeshComponent {
  __type: 'MeshComponent'
  'load mesh on activate': boolean
  'static mesh render node': AzMeshComponentRenderNode
}

export function isAzMeshComponent(component: AzComponent): component is AzMeshComponent {
  return component && component.__type === 'MeshComponent'
}

export interface AzPrefabSpawnerComponent {
  __type: 'PrefabSpawnerComponent'
  m_showprefab: boolean
  m_sliceasset: AzAsset
  m_aliasasset: AzAsset
}
export function isAzPrefabSpawnerComponent(component: AzComponent): component is AzPrefabSpawnerComponent {
  return component && component.__type === 'PrefabSpawnerComponent'
}

export interface AzPointSpawnerComponent {
  __type: 'PointSpawnerComponent'
}

export function isAzPointSpawnerComponent(component: AzComponent): component is AzPointSpawnerComponent {
  return component && component.__type === 'PointSpawnerComponent'
}
