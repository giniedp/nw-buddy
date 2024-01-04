import { Injectable, inject } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import {
  getZoneDescription,
  getZoneIcon,
  getZoneMetaId,
  getZoneName,
  getZoneType,
  isPointInZone,
} from '@nw-data/common'
import { PoiDefinition, Vitals } from '@nw-data/generated'
import { groupBy } from 'lodash'
import { NwDbService } from '~/nw'
import { selectStream } from '~/utils'

@Injectable()
export class ZoneDetailStore extends ComponentStore<{ recordId: string | number; markedVitalId?: string }> {
  protected db = inject(NwDbService)

  public readonly recordId$ = this.select(({ recordId }) => (recordId ? Number(recordId) : null))
  public readonly markedVitalId$ = this.select(({ markedVitalId }) => markedVitalId)

  public readonly territory$ = selectStream(this.db.territory(this.recordId$))
  public readonly poi$ = selectStream(this.db.poi(this.recordId$))
  public readonly area$ = selectStream(this.db.area(this.recordId$))
  public readonly record$ = selectStream(
    {
      territory: this.territory$,
      area: this.area$,
      poi: this.poi$,
    },
    ({ territory, area, poi }) => territory || area || poi,
  )

  public readonly allZones$ = selectStream(
    {
      territories: this.db.territories,
      areas: this.db.areas,
      pois: this.db.pois,
    },
    ({ territories, areas, pois }) => [...territories, ...areas, ...pois],
  )

  private readonly metaId$ = selectStream(this.record$, getZoneMetaId)
  public readonly metadata$ = selectStream(this.db.territoryMetadata(this.metaId$))

  public readonly icon$ = this.select(this.record$, getZoneIcon)
  public readonly name$ = selectStream(this.record$, getZoneName)
  public readonly description$ = selectStream(this.poi$, getZoneDescription)
  public readonly type$ = selectStream(this.record$, getZoneType)

  public readonly spawns$ = selectStream(
    {
      meta: this.metadata$,
      vitals: this.db.vitals,
      vitalsMeta: this.db.vitalsMetadataMap,
    },
    ({ meta, vitals, vitalsMeta }) => {
      if (!meta?.zones?.length || !vitals || !vitalsMeta) {
        return null
      }

      const result: Array<{
        vital: Vitals
        point: number[]
        levels: number[]
        categories: string[]
      }> = []
      const zone = meta.zones[0]
      for (const vital of vitals) {
        const vMeta = vitalsMeta.get(vital.VitalsID)
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
    },
  )

  public vitals$ = selectStream(
    {
      spawn: this.spawns$,
      categories: this.db.vitalsCategoriesMap,
    },
    ({ spawn, categories }) => {
      if (!spawn) {
        return null
      }
      return Object.values(groupBy(spawn, (it) => it.vital.VitalsID.toLowerCase())).map((it) => {
        const vital = it[0].vital
        return {
          ...vital,
          DisplayName: categories.get(it[0].categories[0])?.DisplayName || vital.DisplayName,
          Level: it[0].levels[0] || vital.Level,
        }
      })
    },
  )

  public constructor() {
    super({ recordId: null })
  }

  public load(idOrItem: string | PoiDefinition) {
    if (typeof idOrItem === 'string') {
      this.patchState({ recordId: idOrItem })
    } else {
      this.patchState({ recordId: idOrItem.TerritoryID })
    }
  }
}
