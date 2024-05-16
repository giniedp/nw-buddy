import { z } from 'zod'
import { readJSONFile } from '../../../tools/utils'
import {
  Asset,
  AssetId,
  isAZ__Entity,
  isPolygonPrismCommon,
  isPolygonPrismShapeComponent,
  isSliceComponent,
  isTerritoryDataProviderComponent,
  isTransform,
  isTransformComponent,
} from './types/dynamicslice'
import { resolveAssetFile } from './utils'

export interface TerritoryScanRow {
  territoryID: string
  position: [number, number, number]
  shape: number[][]
}

export async function scanForZones({ rootDir, file }: { rootDir: string; file: string }) {
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
    let vshape: number[][]
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
          vshape = await resolveBoundaryShape(rootDir, component['polygon shape asset id'])
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
        shape: vshape || shape || null
      })
    }
  }
  return result
}

const boundarySchema = z.object({
  vertices: z.array(z.array(z.number())),
})

async function resolveBoundaryShape(rootDir: string, asset: Asset | AssetId) {

  const assetFiles = await resolveAssetFile(rootDir, asset)
  let file: string = null
  if (typeof assetFiles === 'string') {
    file = assetFiles
  } else if (Array.isArray(assetFiles)) {
    file = assetFiles[0]
  }
  if (!file) {
    return null
  }
  const data = await readJSONFile(file, boundarySchema)
  return data?.vertices
}
