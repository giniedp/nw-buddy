import { readJSONFile } from '../../../tools/utils'
import {
  isAZ__Entity,
  isPolygonPrismCommon,
  isPolygonPrismShapeComponent,
  isSliceComponent,
  isTerritoryDataProviderComponent,
  isTransform,
  isTransformComponent,
} from './types/dynamicslice'

export interface TerritoryScanRow {
  territoryID: string
  position: [number, number, number]
  shape: number[][]
}

export async function scanForZones(file: string) {
  if (!file.match(/\/pois\/(territories|zones)\//)) {
    return null
  }
  const data = await readJSONFile(file)
  if (!isAZ__Entity(data)) {
    return null
  }
  const sliceComponent = data.components?.find((it) => isSliceComponent(it))
  if (!sliceComponent || !isSliceComponent(sliceComponent)) {
    return null
  }
  const result: TerritoryScanRow[] = []
  for (const entity of sliceComponent.entities || []) {
    let position: [number, number, number]
    let territoryID: string
    let shape: number[][]
    for (const component of entity.components || []) {
      if (isTransformComponent(component)) {
        if (
          isTransform(component.transform) &&
          typeof component.transform.__value === 'object' &&
          'translation' in component.transform.__value &&
          Array.isArray(component.transform.__value.translation)
        ) {
          position = component.transform.__value.translation as any
        } else if (
          isTransform(component.localtransform) &&
          typeof component.localtransform.__value === 'object' &&
          'translation' in component.localtransform.__value &&
          Array.isArray(component.localtransform.__value.translation)
        ) {
          position = component.localtransform.__value.translation as any
        }
      }
      if (isPolygonPrismShapeComponent(component)) {
        if (isPolygonPrismCommon(component.configuration)) {
          shape = component.configuration.polygonprism.vertexcontainer.vertices
        }
      }
      if (isTerritoryDataProviderComponent(component)) {
        territoryID = component['territory id']
      }
    }
    if (territoryID && (position || shape)) {
      result.push({
        territoryID,
        position: position || null,
        shape: shape || null,
      })
    }
  }
  return result
}
