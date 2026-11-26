import { GameEventData, ScannedEncounter } from '@nw-data/generated'
import { TableGridUtils } from '~/ui/data/table-grid'

export type EncounterTableUtils = TableGridUtils<EncounterTableRecord>
export type EncounterTableRecord = ScannedEncounter

export function encounterColID(util: EncounterTableUtils) {
  return util.colDef<string>({
    colId: 'encounterID',
    headerValueGetter: () => 'ID',
    field: 'encounterID',
    width: 300,
    hide: true,
  })
}

export function encounterColName(util: EncounterTableUtils) {
  return util.colDef<string>({
    colId: 'encounterName',
    headerValueGetter: () => 'Name',
    field: 'name',
    width: 300,
    getQuickFilterText: ({ value }) => value,
  })
}

export function encounterColTag(util: EncounterTableUtils) {
  return util.colDef<string>({
    colId: 'encounterTag',
    headerValueGetter: () => 'Tag',
    field: 'tag',
    getQuickFilterText: ({ value }) => value,
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}
export function encounterColSpawnCount(util: EncounterTableUtils) {
  return util.colDef<number>({
    colId: 'encounterCount',
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Num Spawns',
    getQuickFilterText: () => '',
    width: 150,
    valueGetter: ({ data }) => getEncounterSpawnCount(data),
    filter: 'agNumberColumnFilter',
  })
}
export function getEncounterSpawnCount(encounter: ScannedEncounter) {
  let sum = 0
  if (encounter?.spawns?.length) {
    for (const spawn of encounter.spawns) {
      sum += spawn.positions.length
    }
  }
  return sum
}
