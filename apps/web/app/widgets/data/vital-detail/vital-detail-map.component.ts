import { Component, ElementRef, EventEmitter, Output, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { getZoneInfo, getZoneName, getZoneType } from '@nw-data/common'
import { TerritoryDefinition, VitalsData } from '@nw-data/generated'
import { ScannedTerritory, ScannedVital } from '@nw-data/scanner'
import { sortBy } from 'lodash'
import { NwDataService } from '~/data'
import { TranslateService } from '~/i18n'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgCompress, svgExpand } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { selectSignal } from '~/utils'
import { injectDocument } from '~/utils/injection/document'
import { MapPointMarker, MapViewBounds, MapZoneMarker, WorldMapComponent } from '~/widgets/world-map'
import { VitalDetailStore } from './vital-detail.store'

export interface VitalPointData {
  vitalId?: string
  level?: number
  territories: number[]
  point?: number[]
}

@Component({
  standalone: true,
  selector: 'nwb-vital-detail-map',
  templateUrl: './vital-detail-map.component.html',
  imports: [NwModule, WorldMapComponent, TooltipModule, FormsModule, IconsModule],
  host: {
    class: 'block rounded-md overflow-clip relative',
  },
})
export class VitalDetailMapComponent {
  protected db = inject(NwDataService)
  protected store = inject(VitalDetailStore)
  protected tl8 = inject(TranslateService)

  @Output()
  public vitalClicked = new EventEmitter<VitalPointData>()

  protected data = selectSignal(
    {
      vital: this.store.vital,
      meta: this.store.metadata,
      // poisMap: this.db.poisMap,
      // areasMap: this.db.areasMap,
      territoriesMap: this.db.territoriesMap,
      territoriesMetadataMap: this.db.territoriesMetadataMap,
    },
    (data) => selectData(data, this.tl8),
  )

  protected mapIds = selectSignal(this.data, (it) => Object.keys(it?.points || {}))
  protected fallbackMapId = selectSignal(this.mapIds, (it) => it?.[0])
  protected selectedMapId = signal<string>(null)
  protected mapId = selectSignal(
    {
      selected: this.selectedMapId,
      fallback: this.fallbackMapId,
      mapIds: this.mapIds,
    },
    ({ selected, fallback, mapIds }) => {
      let result = selected ?? fallback
      if (result && !mapIds.includes(result)) {
        result = fallback
      }
      return result
    },
  )

  public readonly pointMarkers = selectSignal(
    {
      mapId: this.mapId,
      data: this.data,
    },
    ({ mapId, data }) => {
      const points = data?.points
      if (!points || !mapId || !points[mapId]) {
        return []
      }

      return points[mapId]
    },
  )

  public readonly zoneMarkers = selectSignal(
    {
      mapId: this.mapId,
      data: this.data,
    },
    ({ mapId, data }) => {
      const zones = data?.zones
      if (!zones || !mapId || !zones[mapId]) {
        return []
      }
      return zones[mapId]
    },
  )

  public readonly bounds = selectSignal(
    {
      mapId: this.mapId,
      meta: this.store.metadata,
    },
    ({ mapId, meta }) => {
      return selectBounds(meta)[mapId]
    },
  )

  public hasMap = selectSignal(this.mapIds, (it) => !!it?.length)

  protected iconExpand = svgExpand
  protected iconCompress = svgCompress
  protected elRef = inject(ElementRef<HTMLElement>)
  private document = injectDocument()
  protected toggleFullscreen() {
    if (this.document.fullscreenElement) {
      this.document.exitFullscreen()
    } else {
      this.elRef.nativeElement.requestFullscreen()
    }
  }

  protected onFeatureClicked(id: string) {
    const payload = this.pointMarkers().find((it) => it.id === id)?.payload
    if (payload?.vitalId) {
      this.vitalClicked.emit(payload)
    }
  }
}

function selectBounds(meta: ScannedVital) {
  const result: Record<string, MapViewBounds> = {}
  if (!meta) {
    return result
  }
  for (const mapId of meta?.mapIDs || []) {
    for (const spawn of meta.spawns[mapId] || []) {
      if (!result[mapId]) {
        result[mapId] = {
          min: [...spawn.p],
          max: [...spawn.p],
        }
      }
      for (let i = 0; i < 2; i++) {
        result[mapId].min[i] = Math.min(result[mapId].min[i], spawn.p[i])
        result[mapId].max[i] = Math.max(result[mapId].max[i], spawn.p[i])
      }
    }
    if (result[mapId]) {
      result[mapId].min[0] -= 30
      result[mapId].min[1] -= 30
      result[mapId].max[0] += 30
      result[mapId].max[1] += 30
    }
  }
  return result
}

function selectData(
  {
    vital,
    meta,
    // poisMap,
    // areasMap,
    territoriesMap,
    territoriesMetadataMap,
  }: {
    vital: VitalsData
    meta: ScannedVital
    // poisMap: Map<number, PoiDefinition>
    // areasMap: Map<number, Areadefinitions>
    territoriesMap: Map<number, TerritoryDefinition>
    territoriesMetadataMap: Map<string, ScannedTerritory>
  },
  tl8: TranslateService,
) {
  const points: Record<string, MapPointMarker<VitalPointData>[]> = {}
  const zones: Record<string, MapZoneMarker<VitalPointData>[]> = {}

  if (!meta || !territoriesMap || !territoriesMetadataMap || !vital) {
    return {
      points,
      zones,
    }
  }

  const territories = sortBy(meta.territories, (id) => {
    const t = territoriesMap.get(id)
    if (!t) {
      return 1000
    }
    if (t.IsArea) {
      return 10
    }
    if (t.IsPOI) {
      return 100
    }
    return 1
  })
  for (const territoryId of territories) {
    const metadata = territoriesMetadataMap.get(String(territoryId).padStart(2, '0'))
    const shape = metadata?.geometry?.[0]?.coordinates?.[0]
    if (!shape) {
      continue
    }

    const zone = territoriesMap.get(territoryId)
    const name = getZoneName(zone)
    const info = getZoneInfo(zone)
    const mapId = 'newworld_vitaeeterna'
    zones[mapId] ??= []
    zones[mapId].push({
      id: `territory:${territoryId}`,
      title: `${getZoneType(zone)}: ${tl8.get(zone.NameLocalizationKey)}`,
      color: '#FFFFFF',
      outlineColor: '#590e0e',
      shape: shape,
      opacity: 0.075,
      payload: {
        territories: [territoryId],
      },
    } satisfies MapZoneMarker<VitalPointData>)
  }

  let id = 0
  const name = tl8.get(vital?.DisplayName) || vital?.VitalsID || meta?.vitalsID
  for (const mapId of meta?.mapIDs || []) {
    for (const spawn of meta.spawns[mapId] || []) {
      id++
      const levels = spawn.l.length ? spawn.l : vital?.Level ? [vital.Level] : []
      points[mapId] ??= []
      points[mapId].push({
        id: `spawn:${id}`,
        title: `${name} (lvl. ${levels.join(', ')})`,
        color: '#DC2626',
        outlineColor: '#590e0e',
        opacity: 1,
        point: spawn.p,
        radius: 10,
        payload: {
          vitalId: vital?.VitalsID,
          level: Math.max(...spawn.l, vital.Level),
          territories: spawn.t,
          point: spawn.p,
        },
      } satisfies MapPointMarker<VitalPointData>)
    }
  }
  return {
    points,
    zones,
  }
}
