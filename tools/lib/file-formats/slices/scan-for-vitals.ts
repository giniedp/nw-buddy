import { scanForData, scanForEncounterType } from './scan-for-spawners-utils'
import { readDynamicSliceFile, resolveDynamicSliceFile } from './utils'

export interface VitalScanRow {
  encounter: string
  vitalsID: string
  npcID: string
  categoryID: string
  gatherableID: string
  level: number
  territoryLevel?: boolean
  damageTable: string
  modelFile: string
  mtlFile?: string
  adbFile?: string
  tags?: string[]
  position?: number[]
  mapID?: string
  trace: string[]
}

export async function scanForVitals(inputDir: string, sliceFile: string): Promise<VitalScanRow[]> {
  sliceFile = await resolveDynamicSliceFile(inputDir, sliceFile)
  const result: VitalScanRow[] = []
  if (!sliceFile) {
    return result
  }

  const sliceComponent = await readDynamicSliceFile(sliceFile)
  if (!sliceComponent) {
    return result
  }

  const data = await scanForData(sliceComponent, inputDir, sliceFile)
  for (const item of data || []) {
    if (!item.vitalsID) {
      continue
    }
    result.push({
      encounter: scanForEncounterType(sliceComponent),
      level: item.level,
      vitalsID: item.vitalsID,
      npcID: item.npcID,
      categoryID: item.categoryID,
      gatherableID: item.gatherableID,
      damageTable: item.damageTable,
      modelFile: item.modelFile,
      mtlFile: item.mtlFile,
      adbFile: item.adbFile,
      tags: item.tags,
      trace: item.trace
    })
  }

  return result
}
