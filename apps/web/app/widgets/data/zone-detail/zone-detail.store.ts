import { Injectable, inject } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { PoiDefinition, Vitals } from '@nw-data/generated'
import { VRCameraMetrics } from 'babylonjs'
import { groupBy } from 'lodash'
import { NwDbService } from '~/nw'
import { selectStream } from '~/utils'

@Injectable()
export class ZoneDetailStore extends ComponentStore<{ recordId: string | number, markedVitalId?: string }> {
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

  private readonly metaId$ = this.select(this.recordId$, (it) => (it < 10 ? `0${it}` : String(it || '')))
  public readonly metadata$ = selectStream(this.db.territoryMetadata(this.metaId$))

  public readonly icon$ = this.select(
    this.poi$,
    (it) => it?.MapIcon || it?.CompassIcon || it?.TooltipBackground || NW_FALLBACK_ICON,
  )
  public readonly name$ = this.select(this.record$, (it) => it?.NameLocalizationKey)
  public readonly description$ = this.select(this.poi$, (it) => {
    return it?.NameLocalizationKey ? `${it.NameLocalizationKey}_description` : null
  })
  public readonly type$ = selectStream(
    {
      territory: this.territory$,
      area: this.area$,
      poi: this.poi$,
    },
    ({ territory, area, poi }) => {
      if (territory) {
        return 'Territory'
      }
      if (area) {
        return 'Area'
      }
      if (poi) {
        return 'POI'
      }
      return null
    },
  )

  public readonly spawns$ = selectStream({
    meta: this.metadata$,
    vitals: this.db.vitals,
    vitalsMeta: this.db.vitalsMetadataMap,
    categoriesMap: this.db.vitalsCategoriesMap,
  }, ({ meta, vitals, vitalsMeta, categoriesMap }) => {
    if (!meta?.zones?.length || !vitals || !vitalsMeta) {
      return null
    }

    const result: Array<{
      vital: Vitals,
      point: number[],
      levels: number[],
      categories: string[]
    }> = []
    const zone = meta.zones[0]
    for(const vital of vitals) {
      const vMeta = vitalsMeta.get(vital.VitalsID)
      const spawns = vMeta?.lvlSpanws?.newworld_vitaeeterna
      if (!spawns?.length) {
        continue
      }
      for (const spawn of spawns) {
        if (!spawn.p.length) {
          continue
        }
        if (!isPointInAABB(spawn.p, zone.min, zone.max)) {
          continue
        }
        if (!isPointInPolygon(spawn.p, zone.shape)) {
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
  })

  public vitals$ = selectStream(this.spawns$, (list) => {
    if (!list) {
      return null
    }
    return Object.values(groupBy(list, (it) => it.vital.VitalsID.toLowerCase())).map((it) => it[0].vital)
  })

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

function isPointInAABB(point: number[], min: number[], max: number[]) {
  const x = point[0]
  const y = point[1]
  if (x < min[0] || x > max[0] || y < min[1] || y > max[1]) {
    return false
  }
  return true
}

function isPointInPolygon(point: number[], vs: number[][]) {
  // ray-casting algorithm based on
  // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html

  const x = point[0]
  const y = point[1]

  let inside = false
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0]
    const yi = vs[i][1]
    const xj = vs[j][0]
    const yj = vs[j][1]

    var intersect = yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) {
      inside = !inside
    }
  }

  return inside
}
