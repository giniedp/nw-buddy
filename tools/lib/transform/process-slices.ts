import * as path from 'path'
import { glob, readJSONFile, withProgressBar } from '../utils'

import { z } from 'zod'

import { DatasheetFile } from '../file-formats/datasheet/converter'
import { isPointInAABB, isPointInPolygon } from '../file-formats/slices/utils'
import { runTasks } from '../worker/runner'
import {
  TerritoryIndex,
  gatherableIndex,
  houseIndex,
  loreIndex,
  npcIndex,
  stationIndex,
  structureIndex,
  territoryIndex,
} from './slice-results'
import { variationIndex } from './slice-results/variation'
import { VitalsIndex, vitalsIndex } from './slice-results/vitals'

export async function processSlices({ inputDir, threads }: { inputDir: string; threads: number }) {
  const npcs = npcIndex()
  const vitals = vitalsIndex()
  //const vitalsModels: Record<string, VitalModelMetadata> = {}
  const gatherables = gatherableIndex()
  const variations = variationIndex()
  const territories = territoryIndex()
  const loreItems = loreIndex()
  const houses = houseIndex()
  const structures = structureIndex()
  const stations = stationIndex()

  const tablesDir = path.join(inputDir, 'sharedassets/springboardentitites')
  const tablesFiles = await glob(path.join(tablesDir, 'datatables', '**', '*.json'))
  const tables: Array<DatasheetFile<any>> = []
  await withProgressBar({ label: 'Read Tables', tasks: tablesFiles }, async (file) => {
    const data = await readJSONFile(
      file,
      z.object({
        header: z.any(),
        rows: z.array(z.any()),
      }),
    )
    tables.push(data as any)
  })

  const files = await glob([
    `${inputDir}/sharedassets/coatlicue/**/regions/**/*.capitals.json`,
    `${inputDir}/sharedassets/coatlicue/**/regions/**/*.metadata.json`,
    `${inputDir}/sharedassets/coatlicue/**/regions/**/*.slicedata.json`,
    `${inputDir}/**/region.distribution.json`,
    `${inputDir}/**/*.dynamicslice.json`,
    `!${inputDir}/lyshineui/**/*`,
  ])

  await runTasks({
    label: 'Processing Slices',
    threads,
    taskName: 'scanSlices',
    tasks: files.map((file) => {
      return {
        inputDir,
        file,
      }
    }),
    onTaskFinish: async (result) => {
      npcs.push(result.npcs)
      vitals.push(result.vitals)
      gatherables.push(result.gatherables)
      variations.push(result.variations)
      territories.push(result.territories)
      loreItems.push(result.loreItems)
      houses.push(result.houseItems)
      structures.push(result.structures)
      stations.push(result.stations)
    },
  })

  const levelMapping = readLevelMapping(tables)
  vitals.addLevels(levelMapping)
  await applyTerritoryToVital(vitals, territories, tables)

  return {
    vitals: vitals.result(),
    vitalsModels: vitals.models(),
    gatherables: gatherables.result(),
    variations: variations.result(),
    territories: territories.result(),
    loreItems: loreItems.result(),
    npcs: npcs.result(),
    houses: houses.result(),
    structures: structures.result(),
    stations: stations.result(),
  }
}

function readLevelMapping(tables: Array<DatasheetFile>) {
  tables = tables.filter((it) => it.header.type === 'VitalsData')
  if (!tables.length) {
    throw new Error('Missing VitalsData table')
  }
  const vitalSchema = z.object({
    VitalsID: z.string(),
    Level: z.number().optional(),
  })
  const levelMap = new Map<string, number>()
  for (const table of tables) {
    for (const row of table.rows) {
      const vital = vitalSchema.parse(row)
      levelMap.set(vital.VitalsID.toLowerCase(), vital.Level)
    }
  }
  return levelMap
}

async function applyTerritoryToVital(vitals: VitalsIndex, territories: TerritoryIndex, tables: Array<DatasheetFile>) {
  tables = tables.filter((it) => it.header.type === 'TerritoryDefinition')
  if (!tables.length) {
    throw new Error('Missing TerritoryDefinition table')
  }

  const schema = z.object({
    rows: z.array(z.object({ TerritoryID: z.number(), AIVariantLevelOverride: z.number().optional() })),
  })
  const pois = tables
    .map((table) => schema.parse(table).rows)
    .flat()
    .map((it) => {
      const territory = territories.get(it.TerritoryID) || territories.get(String(it.TerritoryID).padStart(2, '0'))
      if (!territory?.geometry?.length) {
        return null
      }
      return {
        id: it.TerritoryID,
        level: it.AIVariantLevelOverride,
        geometry: territory.geometry,
      }
    })
    .filter((it) => !!it)

  vitals.addTerritories((position) => {
    if (!position) {
      return []
    }
    const territories: Array<{ TerritoryID: number; LevelOverride: number }> = []
    for (const poi of pois) {
      if (!poi.geometry?.length) {
        continue
      }
      const min = poi.geometry[0].bbox.slice(0, 2)
      const max = poi.geometry[0].bbox.slice(2)
      if (!isPointInAABB(position, min, max)) {
        continue
      }
      if (!isPointInPolygon(position, poi.geometry[0].coordinates[0])) {
        continue
      }
      territories.push({ TerritoryID: poi.id, LevelOverride: poi.level })
    }
    return territories
  })
}
