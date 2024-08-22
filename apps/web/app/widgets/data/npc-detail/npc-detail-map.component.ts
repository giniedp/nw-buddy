import { Component, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NwDataService } from '~/data'
import { TranslateService } from '~/i18n'
import { IconsModule } from '~/ui/icons'
import { svgExpand } from '~/ui/icons/svg'
import { selectSignal } from '~/utils'
import { MapPointMarker, WorldMapComponent } from '~/widgets/world-map'
import { NpcDetailStore } from './npc-detail.store'
import { NpcService } from './npc.service'

const SIZE_COLORS = {
  Emphasis: '#2563EB',
  Common: '#DC2626',
}
const SIZE_OUTLINE = {
  Emphasis: '#092564',
  Common: '#590e0e',
}
const SIZE = {
  Selected: 6,
  Common: 5,
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
  private service = inject(NpcService)
  protected tl8 = inject(TranslateService)
  protected iconExpand = svgExpand

  protected data = selectSignal(
    {
      npcs: this.store.siblings,
      npc: this.store.npc,
      chunksMap: this.service.npcsVariantChunksMap$,
    },
    ({ npcs, npc, chunksMap }) => {
      if (!npcs || !chunksMap) {
        return null
      }
      const result: Record<string, MapPointMarker[]> = {}
      function add({
        mapId,
        name,
        position,
        isSelected,
      }: {
        name: string
        position: number[]
        isSelected: boolean
        mapId: string
      }) {
        result[mapId] ??= []
        result[mapId].push({
          title: `${name} [${position[0].toFixed(2)}, ${position[1].toFixed(2)}]`,
          color: isSelected ? SIZE_COLORS.Emphasis : SIZE_COLORS.Common,
          outlineColor: isSelected ? SIZE_OUTLINE.Emphasis : SIZE_OUTLINE.Common,
          point: position,
          radius: isSelected ? SIZE.Selected : SIZE.Common,
        })
      }

      for (const { id, data, meta, variations } of npcs) {
        const name = data?.GenericName ? this.tl8.get(data?.GenericName) : id
        let isSelected = npc.id === id
        for (const spawn of meta.spawns) {
          for (const position of spawn.positions) {
            if (!position) {
              continue
            }
            add({
              mapId: spawn.mapID,
              name,
              position,
              isSelected,
            })
          }
        }

        for (const variation of variations || []) {
          for (const spawns of variation.meta?.spawns || []) {
            const chunkInfo = spawns.positions
            const chunk = chunksMap.get(chunkInfo.chunkID)
            if (!chunk) {
              continue
            }
            const positions = chunk.data.slice(
              chunkInfo.elementOffset,
              chunkInfo.elementOffset + chunkInfo.elementCount,
            )
            for (const position of positions) {
              add({
                mapId: spawns.mapID,
                name,
                position,
                isSelected,
              })
            }
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
        landmarks: landmarks,
        isLimited: true,
        total,
        bounds: getBounds(landmarks),
      }
    },
  )
}

function getBounds(marks: MapPointMarker[]) {
  let minSelected: number[] = null
  let maxSelected: number[] = null
  let min: number[] = null
  let max: number[] = null
  for (const mark of marks) {
    if (mark.radius === SIZE.Selected) {
      if (!minSelected) {
        minSelected = mark.point
        maxSelected = mark.point
      } else {
        minSelected = [Math.min(minSelected[0], mark.point[0]), Math.min(minSelected[1], mark.point[1])]
        maxSelected = [Math.max(maxSelected[0], mark.point[0]), Math.max(maxSelected[1], mark.point[1])]
      }
    }
    if (!min) {
      min = mark.point
      max = mark.point
    } else {
      min = [Math.min(min[0], mark.point[0]), Math.min(min[1], mark.point[1])]
      max = [Math.max(max[0], mark.point[0]), Math.max(max[1], mark.point[1])]
    }
  }
  if (minSelected && maxSelected) {
    return { min: minSelected, max: maxSelected }
  }
  if (min && max) {
    return { min, max }
  }
  return null
}
