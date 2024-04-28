import { Component, inject, signal } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { uniq } from 'lodash'
import { combineLatest, map, of, switchMap } from 'rxjs'
import { NwDataService } from '~/data'
import { combineLatestOrEmpty, eqCaseInsensitive, mapList, selectSignal, selectStream, switchMapCombineLatest } from '~/utils'
import { MapPointMarker, WorldMapComponent } from '~/widgets/world-map'
import { NpcDetailStore } from './npc-detail.store'
import { IconsModule } from '~/ui/icons'
import { FormsModule } from '@angular/forms'
import { svgExpand } from '~/ui/icons/svg'
import { TranslateService } from '~/i18n'

const SIZE_COLORS = {
  Emphasis: '#2563EB',
  Common: '#DC2626',
}
const SIZE_OUTLINE = {
  Emphasis: '#092564',
  Common: '#590e0e',
}

@Component({
  standalone: true,
  selector: 'nwb-npc-detail-map',
  templateUrl: './npc-detail-map.component.html',
  imports: [WorldMapComponent, IconsModule, FormsModule],
  host: {
    class: 'block',
  },
})
export class NpcDetailMapComponent {
  private db = inject(NwDataService)
  private store = inject(NpcDetailStore)
  protected tl8 = inject(TranslateService)
  protected iconExpand = svgExpand

  private variationsMetadata$ = toObservable(this.store.variations).pipe(
    mapList((it) => it.VariantID),
    map(uniq),
    switchMapCombineLatest((it) => this.db.variationsMeta(it)),
    map((list) => list.filter((it) => !!it)),
  )
  private variationsMetaChunks$ = selectStream(
    this.variationsMetadata$.pipe(
      map((list) => list.filter((it) => it?.variantPositions?.length)),
      switchMap((list) => {
        const chunkIds = uniq(list.map((it) => it.variantPositions.map((chunk) => chunk.chunk)).flat())
        const chunks = combineLatestOrEmpty(
          chunkIds.map((it) => {
            return combineLatest({
              chunk: of(it),
              data: this.db.variationsChunk(it),
            })
          }),
        )
        return chunks
      }),
    ),
  )

  protected data = selectSignal(
    {
      npc: this.store.npc,
      variation: this.store.variation,
      variationsMeta: this.variationsMetadata$,
      chunks: this.variationsMetaChunks$,
    },
    ({ npc, variation, variationsMeta, chunks }) => {
      if (!variationsMeta?.length) {
        return null
      }
      const result: Record<string, MapPointMarker[]> = {}

      for (const meta of variationsMeta) {
        const isSelected = variation?.some((it) => eqCaseInsensitive(it.VariantID, meta.variantID) )

        for (const entry of meta.variantPositions || []) {
          if (!entry?.elementCount) {
            continue
          }
          const chunk = chunks.find((it) => it.chunk === entry.chunk)
          if (!chunk) {
            continue
          }
          const name = npc ? this.tl8.get(npc.GenericName) : ''
          const positions = chunk.data.slice(entry.elementOffset, entry.elementOffset + entry.elementCount)
          const mapId = entry.mapId
          for (const position of positions || []) {
            if (!position) {
              continue
            }
            result[mapId] ??= []
            result[mapId].push({
              title: `${name} [${position[0].toFixed(2)}, ${position[1].toFixed(2)}]`,
              color: isSelected ? SIZE_COLORS.Emphasis : SIZE_COLORS.Common,
              outlineColor: isSelected ? SIZE_OUTLINE.Emphasis : SIZE_OUTLINE.Common,
              point: position,
              radius: isSelected ? 6 : 5,
            })
          }
        }
      }
      return result
    },
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

  protected vm = selectSignal(
    {
      mapId: this.mapId,
      data: this.data,
    },
    ({ mapId, data }) => {
      if (!data || !mapId || !data[mapId]) {
        return null
      }
      const landmarks = data[mapId] || []
      const total = landmarks.length
      return {
        landmarks: landmarks, //.slice(0, limit),
        isLimited: true,
        total,
        bounds: getBounds(landmarks),
      }
    },
  )
}

function getBounds(marks: MapPointMarker[]) {
  let min: number[] = null
  let max: number[] = null
  for (const mark of marks) {
    if (!min) {
      min = mark.point
      max = mark.point
    } else {
      min = [Math.min(min[0], mark.point[0]), Math.min(min[1], mark.point[1])]
      max = [Math.max(max[0], mark.point[0]), Math.max(max[1], mark.point[1])]
    }
  }
  if (min && max) {
    return { min, max }
  }
  return null
}
