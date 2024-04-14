import { computed } from '@angular/core'
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals'
import {
  ZoneDefinition,
  getZoneBackground,
  getZoneDescription,
  getZoneIcon,
  getZoneMetaId,
  getZoneName,
  getZoneType,
  isPointInZone,
} from '@nw-data/common'
import { PoiDefinition, TerritoriesMetadata, Vitals, VitalsMetadata, Vitalscategories } from '@nw-data/generated'
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
      areas: db.areas,
      areasMap: db.areasMap,
      pois: db.pois,
      poisMap: db.poisMap,
      arenas: db.arenas,
      arenasMap: db.arenasMap,
      darknesses: db.darknesses,
      darknessesMap: db.darknessesMap,
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
    const poi = computed(() => nwData().poisMap?.get(recordId()))
    const area = computed(() => nwData().areasMap?.get(recordId()))
    const arena = computed(() => nwData().arenasMap?.get(recordId()))
    const darkness = computed(() => nwData().darknessesMap?.get(recordId()))
    const record = computed(() => territory() || area() || poi() || arena() || darkness())
    const metaId = computed(() => getZoneMetaId(record()))
    const metadata = computed(() => nwData().territoriesMetadata?.get(metaId()))
    return {
      territory,
      poi,
      area,
      arena,
      darkness,
      recordId,
      record,
      metadata,
      allZones: computed(() => {
        return [
          ...(nwData().territories || []),
          ...(nwData().areas || []),
          ...(nwData().pois || []),
          ...(nwData().arenas || []),
          ...(nwData().darknesses || []),
        ]
      }),

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
      load(id: string | number | PoiDefinition) {
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
  vitals: Vitals[]
  vitalsMetaMap: Map<string, VitalsMetadata>
}) {
  if (!zoneMeta?.zones?.length || !vitals || !vitalsMetaMap) {
    return null
  }

  const result: Array<{
    vital: Vitals
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
  vitalCategories: Map<string, Vitalscategories>
}): Vitals[] {
  if (!vitalSpawns) {
    return null
  }
  const result: Vitals[] = []
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

function selectProperties(item: ZoneDefinition) {
  const reject = ['$source', 'NameLocalizationKey', 'MapIcon', 'Description', 'IconPath', 'TooltipBackground']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key))
}
