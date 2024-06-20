import { computed } from '@angular/core'
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals'
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
  TerritoriesMetadata,
  TerritoryDefinition,
  VitalsCategoryData,
  VitalsData,
  VitalsMetadata,
} from '@nw-data/generated'
import { groupBy } from 'lodash'
import { withNwData } from '~/data/with-nw-data'
import { rejectKeys } from '~/utils'

export interface ZoneDetailState {
  zoneId: string | number
  markedVitalId?: string
}

export const ZoneDetailStore = signalStore(
  withState<ZoneDetailState>({ zoneId: null, markedVitalId: null }),
  withNwData((db) => {
    return {
      vitals: db.vitals,
      vitalsMetadataMap: db.vitalsMetadataMap,
      vitalsCategoriesMap: db.vitalsCategoriesMap,
      territoriesMetadata: db.territoriesMetadataMap,
      territories: db.territories,
      territoriesMap: db.territoriesMap,
    }
  }),
  withHooks({
    onInit(state) {
      state.loadNwData()
    },
  }),
  withComputed(({ zoneId, nwData }) => {
    const recordId = computed(() => (zoneId() == null ? null : Number(zoneId())))
    const territory = computed(() => nwData().territoriesMap?.get(recordId()))
    const record = computed(() => territory())
    const metaId = computed(() => getZoneMetaId(record()))
    const metadata = computed(() => nwData().territoriesMetadata?.get(metaId()))
    return {
      territory,
      recordId,
      record,
      metadata,
      allZones: computed(() => nwData().territories || []),

      icon: computed(() => getZoneIcon(record())),
      image: computed(() => getZoneBackground(record())),
      name: computed(() => getZoneName(record())),
      description: computed(() => getZoneDescription(record())),
      properties: computed(() => selectProperties(record())),
      type: computed(() => getZoneType(record())),
    }
  }),

  withComputed(({ metadata, nwData }) => {
    const spawns = computed(() => {
      return selectZoneSpawns({
        zoneMeta: metadata(),
        vitals: nwData().vitals,
        vitalsMetaMap: nwData().vitalsMetadataMap,
      })
    })
    const vitals = computed(() => {
      return selectSpawnVitals({ vitalSpawns: spawns(), vitalCategories: nwData().vitalsCategoriesMap })
    })
    return { spawns, vitals }
  }),
  withMethods((state) => {
    return {
      load(id: string | number | TerritoryDefinition) {
        if (typeof id === 'string' || typeof id === 'number') {
          patchState(state, { zoneId: id })
        } else {
          patchState(state, { zoneId: id?.TerritoryID })
        }
      },
    }
  }),
)

function selectZoneSpawns({
  zoneMeta,
  vitals,
  vitalsMetaMap,
}: {
  zoneMeta: TerritoriesMetadata
  vitals: VitalsData[]
  vitalsMetaMap: Map<string, VitalsMetadata>
}) {
  if (!zoneMeta?.zones?.length || !vitals || !vitalsMetaMap) {
    return null
  }

  const result: Array<{
    vital: VitalsData
    point: number[]
    levels: number[]
    categories: string[]
  }> = []
  const zone = zoneMeta.zones[0]
  for (const vital of vitals) {
    const vMeta = vitalsMetaMap.get(vital.VitalsID)
    const spawns = vMeta?.lvlSpanws?.newworld_vitaeeterna
    if (!spawns?.length) {
      continue
    }
    for (const spawn of spawns) {
      if (!isPointInZone(spawn.p, zone)) {
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
    return null
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
