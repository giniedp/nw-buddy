import { Component, ElementRef, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { LvlSpanws, Vitals, VitalsMetadata } from '@nw-data/generated'
import { crc32 as crc } from 'js-crc'
import { uniq } from 'lodash'
import { startWith } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService, NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgCompress, svgExpand } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { eqCaseInsensitive, selectSignal } from '~/utils'
import { LandMapComponent, Landmark, LandmarkPoint, LandmarkZone } from '~/widgets/land-map'
import { ZoneDetailStore } from './zone-detail.store'

function crc32(value: string) {
  return parseInt(crc(value.toLowerCase()), 16)
}
function toColor(value: string) {
  return `#${crc32(value).toString(16).padStart(6, '0')}`.substring(0, 7)
}
@Component({
  standalone: true,
  selector: 'nwb-zone-detail-map',
  templateUrl: './zone-detail-map.component.html',
  imports: [NwModule, LandMapComponent, TooltipModule, FormsModule, IconsModule],
  host: {
    class: 'block relative',
  },
})
export class ZoneDetailMapComponent {
  protected db = inject(NwDbService)
  protected store = inject(ZoneDetailStore)
  protected tl8 = inject(TranslateService)

  protected data = selectSignal(
    {
      record: this.store.record$,
      data: this.store.metadata$,
      spawns: this.store.spawns$.pipe(startWith(null)),
      vitalId: this.store.markedVitalId$,
      categories: this.db.vitalsCategoriesMap,
    },
    ({ record, data, spawns, vitalId, categories }) => {
      if (!record || !data?.zones) {
        return null
      }
      const result: Landmark[] = []
      for (const zone of data.zones || []) {
        const points = zone.shape.map((point) => [...point])
        result.push({
          title: this.tl8.get(record.NameLocalizationKey),
          color: '#DC2626',
          outlineColor: '#590e0e',
          shape: points,
          opacity: 0.25,
        } satisfies LandmarkZone)
      }
      for (const spawn of spawns || []) {
        const titles = uniq(
          [...spawn.categories.map((it) => categories.get(it)?.DisplayName), spawn.vital.DisplayName]
            .filter((it) => !!it)
            .map((it) => this.tl8.get(it)),
        ).join('<br>')
        const levels = spawn.levels.length ? spawn.levels : [spawn.vital.Level]
        const isMarked = eqCaseInsensitive(vitalId, spawn.vital.VitalsID)
        result.push({
          title: `${titles}<br>Level ${levels}<br>Location: x: ${spawn.point[0].toFixed(2)} y: ${spawn.point[1].toFixed(2)}`,
          color: toColor(spawn.vital.VitalsID),
          outlineColor: isMarked ? '#FFFFFF' : '#000000',
          opacity: isMarked ? 1 : 0.75,
          point: spawn.point,
          radius: isMarked ? 6 : 4,
        } satisfies LandmarkPoint)
      }
      result.sort((a, b) => a.radius - b.radius)
      return result
    },
  )

  public hasMap = selectSignal(this.data, (it) => !!it?.length)

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

function selectData(
  {
    vital,
    meta,
  }: {
    vital: Vitals
    meta: VitalsMetadata
  },
  tl8: TranslateService,
) {
  const result: Record<string, Landmark[]> = {}
  if (!vital || !meta) {
    return result
  }
  const name = tl8.get(vital.DisplayName)
  for (const mapId of meta?.mapIDs || []) {
    for (const spawn of meta.lvlSpanws[mapId as keyof LvlSpanws] || []) {
      result[mapId] ??= []
      result[mapId].push({
        title: `Name: ${name}<br>Level: ${spawn.l ?? '?'}<br>Location: x: ${spawn.p[0].toFixed(
          2,
        )} y: ${spawn.p[1].toFixed(2)}`,
        color: '#DC2626',
        outlineColor: '#590e0e',
        point: spawn.p,
        radius: 10,
      })
    }
  }
  return result
}
