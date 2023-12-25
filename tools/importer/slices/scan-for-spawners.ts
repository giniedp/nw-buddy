import {
  GameTransformComponent,
  SliceComponent,
  isAreaSpawnerComponent,
  isAreaSpawnerComponentServerFacet,
  isEncounterComponent,
  isGameTransformComponent,
  isGatherableControllerComponent,
  isProjectileSpawnerComponent,
  isVariationDataComponent,
} from './types/dynamicslice'
import { findAZEntityById, readDynamicSliceFile, resolveDynamicSliceFile } from './utils'

export async function scanForSpawners(
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
