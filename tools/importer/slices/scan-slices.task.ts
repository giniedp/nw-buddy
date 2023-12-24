import { readJSONFile } from '../../utils'
import { VitalScanRow, scanForVitals } from './scan-for-vitals'
import { Capital } from './types/capitals'
import {
  GameTransformComponent,
  SliceComponent,
  isAZ__Entity,
  isAreaSpawnerComponent,
  isAreaSpawnerComponentServerFacet,
  isEncounterComponent,
  isGameTransformComponent,
  isGatherableControllerComponent,
  isPolygonPrismCommon,
  isPolygonPrismShapeComponent,
  isProjectileSpawnerComponent,
  isSliceComponent,
  isTerritoryDataProviderComponent,
  isTransform,
  isTransformComponent,
  isVariationDataComponent,
} from './types/dynamicslice'
import { isRegionMetadataAsset } from './types/metadata'
import { findAZEntityById, readDynamicSliceFile, resolveDynamicSliceFile } from './utils'

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
  if (file.endsWith('.distribution.json')) {
    return {
      variations: await scanDistributionForVariants(file),
    }
  }
  if (file.endsWith('.dynamicslice.json')) {
    return {
      vitals: await scanForVitals(inputDir, null, file),
      territories: await scanForTerritories(file),
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
      if (capital.sliceName) {
        await scanForSpawners(inputDir, capital.sliceName)
          .then((data) => data || { positions: [] })
          .then(({ positions, variantID, gatherableID }) => {
            if (!variantID) {
              return
            }
            for (const position of positions) {
              if (capital.worldPosition) {
                position[0] += capital.worldPosition.x
                position[1] += capital.worldPosition.y
                position[2] += capital.worldPosition.z
              }
              variationsRows.push({
                mapID: mapId,
                variantID: variantID,
                position: [position[0], position[1], position[2]],
              })
            }
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
    const obj = await readJSONFile(file)
    if (isRegionMetadataAsset(obj)) {
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
    }
    return {
      vitals: vitalsRows,
      gatherables: gatherablesRows,
      variations: variationsRows,
    }
  }
  return {}
}

async function scanDistributionForVariants(file: string) {
  const mapId = file.match(/coatlicue\/(.+)\/regions\//)[1]
  const result: VariationScanRow[] = []
  const data = (await readJSONFile(file)) as {
    region: [number, number]
    slices: string[]
    variants: string[]
    indices: number[]
    positions: [number, number][]
  }

  const areaSize = 2048
  const maxValue = 0xffff
  for (let i = 0; i < data.positions.length; i++) {
    const position = data.positions[i]
    const index = data.indices[i]
    const variant = data.variants[index]
    if (!variant || !position) {
      continue
    }
    const x = (data.region[0] + position[0] / maxValue) * areaSize
    const y = (data.region[1] + position[1] / maxValue) * areaSize
    result.push({
      variantID: variant,
      position: [x, y] as any,
      mapID: mapId,
    })
  }

  return result
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

async function scanForSpawners(
  rootDir: string,
  file: string,
): Promise<{
  variantID?: string
  gatherableID?: string
  positions: Array<number[]>
}> {
  file = await resolveDynamicSliceFile(rootDir, file)
  if (!file) {
    return null
  }

  let sliceComponent = await readDynamicSliceFile(file)
  if (!sliceComponent) {
    return null
  }

  const areaSpawns = await scanForAreaSpawners(sliceComponent, rootDir)
  if (!areaSpawns.sliceFile || !areaSpawns.positions?.length) {
    return null
  }

  sliceComponent = await readDynamicSliceFile(areaSpawns.sliceFile)
  {
    const gatherable = await scanForGatherable(sliceComponent, rootDir)
    if (gatherable) {
      return {
        variantID: gatherable.variantId,
        gatherableID: gatherable.gatherableId,
        positions: areaSpawns.positions,
      }
    }
  }

  const encounterSlices = await scanForEncounterComponents(sliceComponent, rootDir)
  for (const slice of encounterSlices || []) {
    const component = await readDynamicSliceFile(slice)
    if (!component) {
      continue
    }
    const gatherable = await scanForGatherable(component, rootDir)
    if (gatherable) {
      return {
        variantID: gatherable.variantId,
        gatherableID: gatherable.gatherableId,
        positions: areaSpawns.positions,
      }
    }
    const ammoId = await scanForProjectileComponent(component, rootDir)
    if (ammoId === 'WinterConv_GleamiteLauncher_Projectile') {
      return {
        variantID: 'WinterConv_GleamiteChunk',
        positions: areaSpawns.positions,
      }
    }
  }
  return {
    positions: [],
  }
}

async function scanForAreaSpawners(sliceComponent: SliceComponent, rootDir: string) {
  let sliceFile: string
  const positions: number[][] = []
  sliceFile: for (const entity of sliceComponent.entities || []) {
    for (const component of entity.components || []) {
      if (!isAreaSpawnerComponent(component)) {
        continue
      }
      const facet = component.baseclass1?.m_serverfacetptr
      if (!isAreaSpawnerComponentServerFacet(facet)) {
        continue
      }
      if (facet.m_sliceasset?.hint) {
        sliceFile = await resolveDynamicSliceFile(rootDir, facet.m_sliceasset.hint)
      } else if (facet.m_aliasasset?.hint) {
        sliceFile = await resolveDynamicSliceFile(rootDir, facet.m_aliasasset.hint)
      }
      for (const location of facet.m_locations || []) {
        const entity = findAZEntityById(sliceComponent, location.entityid as any)
        const transform = entity?.components?.find((it) => isGameTransformComponent(it)) as GameTransformComponent
        const translation = transform?.m_worldtm?.__value?.['translation'] as number[]
        if (Array.isArray(translation)) {
          positions.push([...translation])
        }
      }
      break sliceFile
    }
  }
  return {
    sliceFile,
    positions,
  }
}

async function scanForGatherable(sliceComponent: SliceComponent, rootDir: string) {
  let variantId: string
  let gatherableId: string
  for (const entity of sliceComponent.entities || []) {
    for (const component of entity.components || []) {
      if (isVariationDataComponent(component) && component.m_selectedvariant) {
        variantId = component.m_selectedvariant
        continue
      }
      if (isGatherableControllerComponent(component) && component.m_gatherableentryid) {
        gatherableId = component.m_gatherableentryid
        continue
      }
    }
  }
  if (!variantId && !gatherableId) {
    return null
  }
  return {
    variantId,
    gatherableId,
  }
}

async function scanForEncounterComponents(sliceComponent: SliceComponent, rootDir: string) {
  const slices: string[] = []
  for (const entity of sliceComponent.entities || []) {
    for (const component of entity.components || []) {
      if (!isEncounterComponent(component)) {
        continue
      }
      for (const spawn of component.m_spawntimeline || []) {
        let file: string
        if (spawn.m_sliceasset?.hint) {
          file = await resolveDynamicSliceFile(rootDir, spawn.m_sliceasset.hint)
        } else if (spawn.m_aliasasset?.hint) {
          file = await resolveDynamicSliceFile(rootDir, spawn.m_aliasasset.hint)
        }
        if (file) {
          slices.push(file)
        }
      }
    }
  }
  return slices
}

async function scanForProjectileComponent(sliceComponent: SliceComponent, rootDir: string) {
  let ammoId: string = null
  ammoId: for (const entity of sliceComponent.entities || []) {
    for (const component of entity.components || []) {
      if (!isProjectileSpawnerComponent(component)) {
        continue
      }
      if (component.m_ammoid) {
        ammoId = component.m_ammoid
        break ammoId
      }
    }
  }
  return ammoId
}
