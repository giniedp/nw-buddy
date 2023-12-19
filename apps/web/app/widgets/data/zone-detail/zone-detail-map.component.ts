import { Component, ElementRef, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { LvlSpanws, Vitals, VitalsMetadata } from '@nw-data/generated'
import { TranslateService } from '~/i18n'
import { NwDbService, NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgCompress, svgExpand } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { selectSignal } from '~/utils'
import { LandMapComponent, Landmark, LandmarkZone } from '~/widgets/land-map'
import { ZoneDetailStore } from './zone-detail.store'

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

  protected data = selectSignal({
    record: this.store.record$,
    data: this.store.metadata$
  },
    ({ record, data }) => {
      if (!record || !data?.zones) {
        return null
      }
      const result = data.zones.map((zone): LandmarkZone => {
        const points = zone.shape.map((point) => {
          return [point[0] + zone.position[0], point[1] + zone.position[1]]
        })
        return {
          title: this.tl8.get(record.NameLocalizationKey),
          color: '#DC2626',
          outlineColor: '#590e0e',
          shape: points,
          opacity: 0.25,
        }
      })
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
        title: `Name: ${name}<br>Level: ${spawn.l ?? '?'}<br>Location: x: ${spawn.p[0].toFixed(2)} y: ${spawn.p[1].toFixed(2)}`,
        color: '#DC2626',
        outlineColor: '#590e0e',
        point: spawn.p,
        radius: 10,
      })
    }
  }
  return result
}
