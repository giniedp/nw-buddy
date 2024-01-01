import { Component, ElementRef, ValueEqualityFn, ViewChild, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { crc32 as crc } from 'js-crc'
import { isEqual, uniq } from 'lodash'
import { startWith } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService, NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgCompress, svgExpand } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { eqCaseInsensitive, selectSignal, selectStream } from '~/utils'
import { LandMapComponent, Landmark, LandmarkPoint, LandmarkZone, MapView } from '~/widgets/land-map'
import { ZoneDetailStore } from './zone-detail.store'

function crc32(value: string) {
  return parseInt(crc(value.toLowerCase()), 16)
}
function toColor(value: string) {
  return `#${crc32(value).toString(16).padStart(6, '0')}`.substring(0, 7)
}

const COLORS = {
  Primary: '#f28c18',
  Success: '#51A800',
  Info: '#2563EB',
  Error: '#DC2626',
  Secondary: '#6D3A9C',
}
const COLORS_DIMMED = {
  Primary: '#653806',
  Success: '#204300',
  Info: '#092564',
  Error: '#590e0e',
  Secondary: '#2c173e',
}

@Component({
  standalone: true,
  selector: 'nwb-zone-detail-map',
  templateUrl: './zone-detail-map.component.html',
  imports: [NwModule, LandMapComponent, TooltipModule, FormsModule, IconsModule],
  host: {
    class: 'flex flex-col relative',
  },
})
export class ZoneDetailMapComponent {
  protected db = inject(NwDbService)
  protected store = inject(ZoneDetailStore)
  protected tl8 = inject(TranslateService)

  @ViewChild(LandMapComponent, { static: false })
  protected mapComponent: LandMapComponent

  protected mapView = toSignal(
    selectStream(
      {
        type: this.store.type$,
        meta: this.store.metadata$,
      },
      ({ type, meta }): MapView => {
        if (!meta?.zones?.length) {
          return null
        }

        const min = meta.zones[0].min
        const max = meta.zones[0].max
        const width = max[0] - min[0]
        const height = max[1] - min[1]

        const view: MapView = {
          x: min[1] + width / 2,
          y: min[0] + height / 2,
          zoom: type === 'Territory' ? 3 : type === 'Area' ? 5 : 6,
        }
        return view
      },
      { equal: isEqual as ValueEqualityFn<MapView> },
    ),
  )

  protected landmarks = selectSignal(
    {
      zoneId: this.store.recordId$,
      zoneMeta: this.store.metadata$,
      spawns: this.store.spawns$.pipe(startWith(null)),
      vitalId: this.store.markedVitalId$,
      categories: this.db.vitalsCategoriesMap,
      zones: this.store.allZones$,
      zonesMetaMap: this.db.territoriesMetadataMap,
    },
    ({ zoneId, zoneMeta, spawns, vitalId, categories, zones, zonesMetaMap }) => {
      if (!zoneMeta) {
        return null
      }
      const result: Landmark[] = []
      for (const zone of zones || []) {
        const metaId = String(zone.TerritoryID).padStart(2, '0')
        const meta = zonesMetaMap.get(metaId)
        if (!meta?.zones?.length) {
          continue
        }
        const isSelected = zone.TerritoryID === zoneId
        for (const entry of meta.zones) {
          result.push({
            title: this.tl8.get(zone.NameLocalizationKey),
            color: isSelected ? COLORS.Info : '#FFFFFF',
            outlineColor: isSelected ? COLORS_DIMMED.Info : COLORS_DIMMED.Error,
            shape: entry.shape.map((point) => [...point]),
            opacity: isSelected ? 0.25 : 0.05,
          } satisfies LandmarkZone)
        }
      }

      for (const spawn of spawns || []) {
        const titles = uniq(
          [...spawn.categories.map((it) => categories.get(it)?.DisplayName), spawn.vital.DisplayName]
            .filter((it) => !!it)
            .map((it) => this.tl8.get(it)),
        ).join('<br>')
        const levels = spawn.levels.length ? spawn.levels : [spawn.vital.Level]
        const hasMark = !!vitalId
        const isMarked = eqCaseInsensitive(vitalId, spawn.vital.VitalsID)
        result.push({
          title: `${titles}<br>Level ${levels}<br>Location: x: ${spawn.point[0].toFixed(2)} y: ${spawn.point[1].toFixed(
            2,
          )}`,
          color: toColor(spawn.vital.VitalsID),
          outlineColor: hasMark && isMarked ? '#FFFFFF' : '#000000',
          opacity: isMarked || !hasMark ? 1 : 0.75,
          point: spawn.point,
          radius: isMarked ? 6 : 4,
        } satisfies LandmarkPoint)
      }
      result.sort((a, b) => a.radius - b.radius)
      return result
    },
  )

  public hasMap = selectSignal(this.landmarks, (it) => !!it?.length)

  protected iconExpand = svgExpand
  protected iconCompress = svgCompress
  protected elRef = inject(ElementRef<HTMLElement>)

  protected toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      this.elRef.nativeElement.requestFullscreen()
    }
  }
}
