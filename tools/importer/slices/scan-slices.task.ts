import { readJSONFile } from '../../utils'
import { walkJsonObjects } from '../../utils/walk-json-object'
import { scanForVitals, VitalScanRow } from './scan-for-vitals'
import { Capital } from './types/capitals'
import { isAZ__Entity, isPolygonPrismCommon, isPolygonPrismShapeComponent, isSliceComponent, isTerritoryDataProviderComponent, isTransform, isTransformComponent } from './types/dynamicslice'
import { isRegionMetadataAsset } from './types/metadata'

function loadCrcFile(file: string) {
  const result = require(file)
  if (typeof result !== 'object') {
    throw new Error('invalid file')
  }
  return result as Record<number | string, string>
}

export interface ScanResult {
  vitals?: VitalScanRow[]
  gatherables?: GatherableScanRow[]
  variations?: VariationScanRow[]
  territories?: TerritoryScanRow[]
}

export interface GatherableScanRow {
  gatherableID: string
  position: [number, number, number]
  lootTable: string
  mapID: string
}

export interface VariationScanRow {
  variantID: string
  position: [number, number, number]
  mapID: string
}

export interface TerritoryScanRow {
  territoryID: string
  position: [number, number, number]
  shape: number[][]
}

export async function scanSlices({
  inputDir,
  file,
  crcVitalsFile,
  crcVitalsCategoriesFile,
  crcGatherablesFile,
  crcVariationsFile,
}: {
  inputDir: string
  file: string
  crcVitalsFile: string
  crcVitalsCategoriesFile: string
  crcGatherablesFile: string
  crcVariationsFile: string
}): Promise<ScanResult> {
  if (file.endsWith('.dynamicslice.json')) {
    return {
      vitals: await scanForVitals(inputDir, null, file),
      territories: await scanForTerritories(file)
    }
  }
  if (file.endsWith('.capitals.json')) {
    const mapId = file.match(/coatlicue\/(.+)\/regions\//)[1]
    const data = await readJSONFile<Capital>(file)
    const vitalsRows: VitalScanRow[] = []
    const variationsRows: VariationScanRow[] = []
    for (const capital of data?.Capitals || []) {
      await scanForVitals(inputDir, capital.sliceName)
        .catch((err) => {
          console.error(err)
          return []
        })
        .then((vitals) => {
          for (const vital of vitals || []) {
            vitalsRows.push({
              ...vital,
              position: capital.worldPosition
                ? [capital.worldPosition.x, capital.worldPosition.y, capital.worldPosition.z]
                : null,
              mapID: mapId,
            })
          }
        })
      if (capital.variantName) {
        variationsRows.push({
          mapID: mapId,
          variantID: capital.variantName,
          position: capital.worldPosition
            ? [capital.worldPosition.x, capital.worldPosition.y, capital.worldPosition.z]
            : null,
        })
      }
    }
    return {
      vitals: vitalsRows,
      variations: variationsRows,
    }
  }
  if (file.endsWith('.metadata.json')) {
    const mapId = file.match(/coatlicue\/(.+)\/regions\//)[1]
    const vitalsRows: VitalScanRow[] = []
    const gatherablesRows: GatherableScanRow[] = []
    const variationsRows: VariationScanRow[] = []
    walkJsonObjects(await readJSONFile(file), (obj: unknown) => {
      if (!isRegionMetadataAsset(obj)) {
        return false
      }
      for (const location of obj.aispawnlocations || []) {
        const vitalId = loadCrcFile(crcVitalsFile)[location.vitalsid?.value]
        if (!vitalId) {
          continue
        }
        vitalsRows.push({
          vitalsID: vitalId,
          categoryID: loadCrcFile(crcVitalsCategoriesFile)[location.vitalscategoryid?.value],
          level: location.vitalslevel,
          damageTable: null,
          position: location.worldposition,
          mapID: mapId,
          modelSlice: null,
        })
      }
      for (const location of obj.gatherablelocations || []) {
        const gatherableId = loadCrcFile(crcGatherablesFile)[location.gatherableid?.value]
        if (gatherableId) {
          gatherablesRows.push({
            gatherableID: gatherableId,
            position: location.worldposition as [number, number, number],
            lootTable: location.loottableid,
            mapID: mapId,
          })
        }
        const variantId = loadCrcFile(crcVariationsFile)[location.gatherableid?.value]
        if (variantId) {
          variationsRows.push({
            variantID: variantId,
            position: location.worldposition as [number, number, number],
            //lootTable: location.loottableid,
            mapID: mapId,
          })
        }
      }
    })
    return {
      vitals: vitalsRows,
      gatherables: gatherablesRows,
      variations: variationsRows,
    }
  }
}

async function scanForTerritories(file: string) {
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
