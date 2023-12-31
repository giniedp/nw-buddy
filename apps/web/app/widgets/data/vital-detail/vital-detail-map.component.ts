import { Component, ElementRef, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { LvlSpanws, Vitals, VitalsMetadata } from '@nw-data/generated'
import { TranslateService } from '~/i18n'
import { NwDbService, NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgCompress, svgExpand } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { selectSignal } from '~/utils'
import { LandMapComponent, Landmark, LandmarkPoint } from '~/widgets/land-map'
import { VitalDetailStore } from './vital-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-vital-detail-map',
  templateUrl: './vital-detail-map.component.html',
  imports: [NwModule, LandMapComponent, TooltipModule, FormsModule, IconsModule],
  host: {
    class: 'block rounded-md overflow-clip relative',
  },
})
export class VitalDetailMapComponent {
  protected db = inject(NwDbService)
  protected store = inject(VitalDetailStore)
  protected tl8 = inject(TranslateService)

  protected data = selectSignal(
    {
      vital: this.store.vital$,
      meta: this.store.metadata$,
    },
    (data) => selectData(data, this.tl8),
  )

  protected mapIds = selectSignal(this.data, (it) => Object.keys(it || {}))
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

  public readonly landmarks = selectSignal(
    {
      mapId: this.mapId,
      data: this.data,
    },
    ({ mapId, data }) => {
      if (!data || !mapId || !data[mapId]) {
        return []
      }
      return data[mapId]
    },
  )

  public hasMap = selectSignal(this.mapIds, (it) => !!it?.length)

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
  if (!meta) {
    return result
  }
  const name = tl8.get(vital?.DisplayName) || vital?.VitalsID || meta?.vitalsID
  for (const mapId of meta?.mapIDs || []) {
    for (const spawn of meta.lvlSpanws[mapId as keyof LvlSpanws] || []) {
      result[mapId] ??= []
      result[mapId].push({
        title: `Name: ${name}<br>Level: ${(spawn.l || vital?.Level) ?? '?'}<br>Location: x: ${spawn.p[0].toFixed(2)} y: ${spawn.p[1].toFixed(2)}`,
        color: '#DC2626',
        outlineColor: '#590e0e',
        opacity: 1,
        point: spawn.p,
        radius: 10,
      } satisfies LandmarkPoint)
    }
  }
  return result
}
