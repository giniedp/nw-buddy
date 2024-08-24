import { payload, withRedux } from '@angular-architects/ngrx-toolkit'
import { computed, inject } from '@angular/core'
import { patchState, signalStore, withComputed, withState } from '@ngrx/signals'
import {
  getZoneBackground,
  getZoneDescription,
  getZoneIcon,
  getZoneMetaId,
  getZoneName,
  getZoneType,
  isPointInZone,
} from '@nw-data/common'
import {
  TerritoryDefinition,
  VitalsCategoryData,
  VitalsData,
} from '@nw-data/generated'
import { ScannedTerritory, ScannedVital } from '@nw-data/scanner'
import { groupBy } from 'lodash'
import { EMPTY, catchError, combineLatest, map, of, switchMap } from 'rxjs'
import { NwDataService } from '~/data'
import { rejectKeys, selectStream } from '~/utils'

export interface ZoneSpawn {
  vital: VitalsData
  point: number[]
  levels: number[]
  categories: string[]
}
export interface ZoneDetailState {
  recordId: number
  record: TerritoryDefinition
  markedVitalId?: string
  isLoaded: boolean
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
    isLoaded: false,
  }),
  withRedux({
    actions: {
      public: {
        load: payload<{ zoneId: string | number }>(),
        mark: payload<{ vitalId: string }>(),
      },
      private: {
        loaded: payload<Omit<ZoneDetailState, 'isLoaded'>>(),
      },
    },
    reducer(actions, on) {
      on(actions.load, (state) => {
        patchState(state, {
          isLoaded: false,
        })
      })
      on(actions.mark, (state, { vitalId }) => {
        patchState(state, {
          markedVitalId: vitalId,
        })
      })
      on(actions.loaded, (state, data) => {
        patchState(state, {
          ...data,
          isLoaded: true,
        })
      })
    },
    effects(actions, create) {
      const db = inject(NwDataService)
      return {
        load$: create(actions.load).pipe(
          switchMap(({ zoneId }) => loadState(db, zoneId)),
          map((data) => actions.loaded(data)),
          catchError((error) => {
            console.error(error)
            return EMPTY
          }),
        ),
      }
    },
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

function loadState(db: NwDataService, zoneId: string | number) {
  const recordId = zoneId == null ? null : Number(zoneId)
  const record$ = db.territory(recordId)
  const metaId$ = record$.pipe(map(getZoneMetaId))
  const metadata$ = db.territoryMetadata(metaId$)
  const spawns$ = selectStream(
    {
      zoneMeta: metadata$,
      vitals: db.vitals,
      vitalsMetaMap: db.vitalsMetadataMap,
    },
    selectZoneSpawns,
  )
  const vitals$ = selectStream(
    {
      vitalSpawns: spawns$,
      vitalCategories: db.vitalsCategoriesMap,
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
  const reject = ['$source', 'NameLocalizationKey', 'MapIcon', 'Description', 'IconPath', 'TooltipBackground']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key))
}
