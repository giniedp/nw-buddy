import { Injectable, computed, inject } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
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
import { NwDataService } from '~/data'
import { withNwData } from '~/data/with-nw-data'
import { rejectKeys, selectStream } from '~/utils'

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

// @Injectable()
// export class ZoneDetailStore extends ComponentStore<{ recordId: string | number; markedVitalId?: string }> {
//   protected db = inject(NwDataService)

//   public readonly recordId$ = this.select(({ recordId }) => (recordId ? Number(recordId) : null))
//   public readonly markedVitalId$ = this.select(({ markedVitalId }) => markedVitalId)

//   public readonly territory$ = selectStream(this.db.territory(this.recordId$))
//   public readonly poi$ = selectStream(this.db.poi(this.recordId$))
//   public readonly area$ = selectStream(this.db.area(this.recordId$))
//   public readonly arena$ = selectStream(this.db.arena(this.recordId$))
//   public readonly darkness$ = selectStream(this.db.darkness(this.recordId$))
//   public readonly record$ = selectStream(
//     {
//       territory: this.territory$,
//       area: this.area$,
//       poi: this.poi$,
//       arena: this.arena$,
//       darkness: this.darkness$,
//     },
//     ({ territory, area, poi, arena, darkness }) => territory || area || poi || arena || darkness,
//   )

//   public readonly allZones$ = selectStream(
//     {
//       territories: this.db.territories,
//       areas: this.db.areas,
//       pois: this.db.pois,
//       arenas: this.db.arenas,
//       darknesses: this.db.darknesses,
//     },
//     ({ territories, areas, pois, arenas, darknesses }) => [...territories, ...areas, ...pois, ...arenas, ...darknesses],
//   )

//   private readonly metaId$ = selectStream(this.record$, getZoneMetaId)
//   public readonly metadata$ = selectStream(this.db.territoryMetadata(this.metaId$))

//   public readonly icon$ = this.select(this.record$, getZoneIcon)
//   public readonly image$ = this.select(this.poi$, (it) => it?.TooltipBackground)
//   public readonly name$ = selectStream(this.record$, getZoneName)
//   public readonly description$ = selectStream(this.poi$, getZoneDescription)
//   public readonly properties$ = this.select(this.record$, selectProperties)
//   public readonly type$ = selectStream(this.record$, getZoneType)

//   public readonly spawns$ = selectStream(
//     {
//       meta: this.metadata$,
//       vitals: this.db.vitals,
//       vitalsMeta: this.db.vitalsMetadataMap,
//     },
//     ({ meta, vitals, vitalsMeta }) => {
//       if (!meta?.zones?.length || !vitals || !vitalsMeta) {
//         return null
//       }

//       const result: Array<{
//         vital: Vitals
//         point: number[]
//         levels: number[]
//         categories: string[]
//       }> = []
//       const zone = meta.zones[0]
//       for (const vital of vitals) {
//         const vMeta = vitalsMeta.get(vital.VitalsID)
//         const spawns = vMeta?.lvlSpanws?.newworld_vitaeeterna
//         if (!spawns?.length) {
//           continue
//         }
//         for (const spawn of spawns) {
//           if (!isPointInZone(spawn.p, zone)) {
//             continue
//           }
//           result.push({
//             vital,
//             point: spawn.p,
//             levels: spawn.l,
//             categories: spawn.c,
//           })
//         }
//       }
//       return result
//     },
//   )

//   public vitals$ = selectStream(
//     {
//       spawn: this.spawns$,
//       categories: this.db.vitalsCategoriesMap,
//     },
//     ({ spawn, categories }) => {
//       if (!spawn) {
//         return null
//       }
//       return Object.values(groupBy(spawn, (it) => it.vital.VitalsID.toLowerCase())).map((it) => {
//         const vital = it[0].vital
//         return {
//           ...vital,
//           DisplayName: categories.get(it[0].categories[0])?.DisplayName || vital.DisplayName,
//           Level: it[0].levels[0] || vital.Level,
//         }
//       })
//     },
//   )

//   public constructor() {
//     super({ recordId: null })
//   }

//   public load(idOrItem: string | PoiDefinition) {
//     if (typeof idOrItem === 'string') {
//       this.patchState({ recordId: idOrItem })
//     } else {
//       this.patchState({ recordId: idOrItem.TerritoryID })
//     }
//   }
// }

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
