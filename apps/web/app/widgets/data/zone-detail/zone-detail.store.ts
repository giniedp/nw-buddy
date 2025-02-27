import { computed } from '@angular/core'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import {
  getZoneBackground,
  getZoneDescription,
  getZoneIcon,
  getZoneMetaId,
  getZoneName,
  getZoneType,
  isPointInZone,
} from '@nw-data/common'
import { TerritoryDefinition, VitalsBaseData, VitalsCategoryData, VitalsLevelVariantData } from '@nw-data/generated'
import { ScannedTerritory, ScannedVital } from '@nw-data/generated'
import { NwDataSheets } from 'libs/nw-data/db/nw-data-sheets'
import { groupBy } from 'lodash'
import { combineLatest, from, map, of, switchMap } from 'rxjs'
import { injectNwData, withStateLoader } from '~/data'
import { rejectKeys, selectStream } from '~/utils'

export interface ZoneSpawn {
  vital: VitalsData
  point: number[]
  levels: number[]
  categories: string[]
}
type VitalsData = VitalsBaseData & VitalsLevelVariantData

export interface ZoneDetailState {
  recordId: number
  record: TerritoryDefinition
  markedVitalId?: string
  vitals: VitalsData[]
  spawns: ZoneSpawn[]
  metadata: ScannedTerritory
}

export const ZoneDetailStore = signalStore(
  withState<ZoneDetailState>({
    recordId: null,
    record: null,
    markedVitalId: null,
    metadata: null,
    vitals: [],
    spawns: [],
  }),
  withStateLoader(() => {
    const db = injectNwData()
    return {
      load({ territoryId }: { territoryId: number | string }) {
        return loadState(db, territoryId)
      },
    }
  }),
  withMethods((state) => {
    return {
      markVital: (markedVitalId: string) => {
        patchState(state, { markedVitalId })
      },
    }
  }),
  withComputed(({ record }) => {
    return {
      icon: computed(() => getZoneIcon(record())),
      image: computed(() => getZoneBackground(record())),
      name: computed(() => getZoneName(record())),
      description: computed(() => getZoneDescription(record())),
      properties: computed(() => selectProperties(record())),
      type: computed(() => getZoneType(record())),
    }
  }),
)

function loadState(db: NwDataSheets, zoneId: string | number) {
  const recordId = zoneId == null ? null : Number(zoneId)
  const record$ = from(db.territoriesById(recordId))
  const metaId$ = record$.pipe(map(getZoneMetaId))
  const metadata$ = metaId$.pipe(switchMap((id) => db.territoriesMetadataById(id)))
  const spawns$ = selectStream(
    {
      zoneMeta: metadata$,
      vitals: db.vitalsAll(),
      vitalsMetaMap: db.vitalsMetadataByIdMap(),
    },
    selectZoneSpawns,
  )
  const vitals$ = selectStream(
    {
      vitalSpawns: spawns$,
      vitalCategories: db.vitalsCategoriesByIdMap(),
    },
    selectSpawnVitals,
  )

  return combineLatest({
    recordId: of(recordId),
    record: record$,
    metaId: metaId$,
    metadata: metadata$,
    spawns: spawns$,
    vitals: vitals$,
    markedVitalId: of(null),
  })
}

function selectZoneSpawns({
  zoneMeta,
  vitals,
  vitalsMetaMap,
}: {
  zoneMeta: ScannedTerritory
  vitals: VitalsData[]
  vitalsMetaMap: Map<string, ScannedVital>
}) {
  if (!zoneMeta?.geometry?.length || !vitals || !vitalsMetaMap) {
    return null
  }

  const result: Array<{
    vital: VitalsData
    point: number[]
    levels: number[]
    categories: string[]
  }> = []
  for (const vital of vitals) {
    const vMeta = vitalsMetaMap.get(vital.VitalsID)
    const spawns = vMeta?.spawns?.['newworld_vitaeeterna']
    if (!spawns?.length) {
      continue
    }
    for (const spawn of spawns) {
      if (!isPointInZone(spawn.p, zoneMeta)) {
        continue
      }
      result.push({
        vital,
        point: spawn.p,
        levels: spawn.l,
        categories: spawn.c,
      })
    }
  }
  return result
}

function selectSpawnVitals({
  vitalSpawns,
  vitalCategories,
}: {
  vitalSpawns: ReturnType<typeof selectZoneSpawns>
  vitalCategories: Map<string, VitalsCategoryData>
}): VitalsData[] {
  if (!vitalSpawns) {
    return []
  }
  const result: VitalsData[] = []
  const groups = groupBy(vitalSpawns, (it) => it.vital.VitalsID.toLowerCase())
  for (const group of Object.values(groups)) {
    const spawn = group[0]
    const vital = spawn.vital
    const category = vitalCategories?.get(spawn.categories[0])
    const level = spawn.levels[0]
    result.push({
      ...vital,
      DisplayName: category?.DisplayName || vital.DisplayName,
      Level: level || vital.Level,
    })
  }
  return result
}

function selectProperties(item: TerritoryDefinition) {
  const reject = ['NameLocalizationKey', 'MapIcon', 'Description', 'IconPath', 'TooltipBackground']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key) || key.startsWith('$'))
}
