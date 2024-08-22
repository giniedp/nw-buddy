import { OverlayModule } from '@angular/cdk/overlay'
import { DecimalPipe } from '@angular/common'
import { Component, ElementRef, inject, input, signal } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { GatherableNodeSize, getGatherableNodeSize } from '@nw-data/common'
import saveAs from 'file-saver'
import { isEqual } from 'lodash'
import { NwDataService } from '~/data'
import { TranslateService } from '~/i18n'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgExpand } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { eqCaseInsensitive, selectSignal, selectStream } from '~/utils'
import { injectDocument } from '~/utils/injection/document'
import { MapPointMarker, WorldMapComponent } from '~/widgets/world-map'
import { GatherableService, isLootTableEmpty } from '../gatherable/gatherable.service'

const SIZE_COLORS: Record<GatherableNodeSize, string> = {
  Tiny: '#f28c18',
  Small: '#51A800',
  Medium: '#2563EB',
  Large: '#DC2626',
  Huge: '#6D3A9C',
}
const SIZE_OUTLINE: Record<GatherableNodeSize, string> = {
  Tiny: '#653806',
  Small: '#204300',
  Medium: '#092564',
  Large: '#590e0e',
  Huge: '#2c173e',
}

const SIZE_LABELS: Record<GatherableNodeSize, string> = {
  Tiny: 'XS',
  Small: 'S',
  Medium: 'M',
  Large: 'L',
  Huge: 'XL',
}
const SIZE_RADIUS: Record<GatherableNodeSize, number> = {
  Tiny: 6,
  Small: 7,
  Medium: 8,
  Large: 9,
  Huge: 10,
}
const SIZE_ORDER = ['Tiny', 'Small', 'Medium', 'Large', 'Huge']

@Component({
  standalone: true,
  selector: 'nwb-gatherable-detail-map',
  templateUrl: './gatherable-detail-map.component.html',
  imports: [
    DecimalPipe,
    NwModule,
    TooltipModule,
    FormsModule,
    OverlayModule,
    LayoutModule,
    WorldMapComponent,
    IconsModule,
  ],
  providers: [DecimalPipe],
  host: {
    class: 'block relative',
    '[hidden]': '!hasMap()',
  },
})
export class GatherableDetailMapComponent {
  protected db = inject(NwDataService)
  protected tl8 = inject(TranslateService)
  protected service = inject(GatherableService)

  public tag = input<string>()
  public gatherableIds = input<string[]>()
  private gatherableIds$ = selectStream(toObservable(this.gatherableIds), (it) => it, { equal: isEqual })
  private data = selectSignal(
    {
      gatherables: this.service.gatherables(this.gatherableIds$),
      positionChunks: this.service.positionChunks(this.gatherableIds$),
    },
    ({ gatherables, positionChunks }) => {
      const result: Record<string, Record<string, MapPointMarker[]>> = {}

      for (const gatherable of gatherables || []) {
        const name = this.tl8.get(gatherable.DisplayName) || gatherable.GatherableID
        const size = getGatherableNodeSize(gatherable.GatherableID) || ('Nodes' as GatherableNodeSize)
        const meta = gatherable.$meta
        const tags: string[] = []
        if (gatherable.FinalLootTable) {
          tags.push(gatherable.FinalLootTable.toLowerCase())
        }

        if (size) {
          tags.push(size.toLowerCase())
        }

        for (const spawn of meta.spawns || []) {
          for (const position of spawn.positions || []) {
            result[spawn.mapID] ??= {}
            result[spawn.mapID][size] ??= []
            result[spawn.mapID][size].push({
              title: `${name} [${position[0].toFixed(2)}, ${position[1].toFixed(2)}]`,
              color: SIZE_COLORS[size] || SIZE_COLORS.Medium,
              outlineColor: SIZE_OUTLINE[size] || SIZE_OUTLINE.Medium,
              point: position,
              radius: SIZE_RADIUS[size] || SIZE_RADIUS.Medium,
              layer: size,
              tags: tags,
            })
          }
        }
        for (const variation of gatherable.$variations || []) {
          const name = this.tl8.get(variation.Name || gatherable.DisplayName) || gatherable.GatherableID
          const size = getGatherableNodeSize(gatherable.GatherableID) || ('Nodes' as GatherableNodeSize)
          const tags: string[] = []
          const found = variation.Gatherables.find((it) => eqCaseInsensitive(it.GatherableID, gatherable.GatherableID))

          const lootTables: string[] = []
          if (found?.LootTable?.length) {
            lootTables.push(...found.LootTable)
          }
          if (!isLootTableEmpty(gatherable.FinalLootTable)) {
            lootTables.push(gatherable.FinalLootTable)
          }
          if (variation.VariantID) {
            tags.push(variation.VariantID.toLowerCase())
          }

          if (lootTables.length) {
            tags.push(...lootTables)
          }
          if (size) {
            tags.push(size.toLowerCase())
          }
          // for (const meta of variation.$meta?. || []) {
          //   const mapId = meta.mapId
          //   const chunk = positionChunks.find((it) => it.chunk === meta.chunk)
          //   if (!chunk) {
          //     continue
          //   }
          //   const positions = chunk.data.slice(meta.elementOffset, meta.elementOffset + meta.elementCount)
          //   for (const position of positions || []) {
          //     let title = `
          //       ${name}<br>
          //       <span class="ml-4">coord: [${position[0].toFixed(2)}, ${position[1].toFixed(2)}]</span>
          //     `
          //     for (const lootTable of lootTables) {
          //       if (lootTable) {
          //         title += `<br><span class="ml-4">loot: ${humanize(lootTable)}</span>`
          //       }
          //     }
          //     result[mapId] ??= {}
          //     result[mapId][size] ??= []
          //     result[mapId][size].push({
          //       title: `<div class="font-mono">${title}</div>`,
          //       color: SIZE_COLORS[size] || SIZE_COLORS.Medium,
          //       outlineColor: SIZE_OUTLINE[size] || SIZE_OUTLINE.Medium,
          //       point: position,
          //       radius: SIZE_RADIUS[size] || SIZE_RADIUS.Medium,
          //       layer: size,
          //       tags: tags,
          //     })
          //   }
          // }
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

  protected disabledSizes = signal<string[]>([])
  protected availableSizes = selectSignal(
    {
      data: this.data,
      mapId: this.mapId,
      disalbedSizes: this.disabledSizes,
    },
    ({ data, mapId, disalbedSizes }) => {
      if (!data || !mapId || !data[mapId]) {
        return []
      }
      return Object.keys(data[mapId])
        .sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b))
        .map((size) => {
          return {
            label: SIZE_LABELS[size] || size,
            value: size,
            color: SIZE_COLORS[size],
            count: data[mapId][size].length,
            disabled: disalbedSizes.includes(size),
          }
        })
    },
  )

  protected vm = selectSignal(
    {
      mapId: this.mapId,
      data: this.data,
      disabledSizes: this.disabledSizes,
    },
    ({ mapId, data, disabledSizes }) => {
      if (!data || !mapId || !data[mapId]) {
        return null
      }
      const result = {
        ...(data[mapId] || {}),
      }
      for (const size of disabledSizes) {
        delete result[size]
      }

      const landmarks = Object.values(result).flat()
      landmarks.sort((a, b) => b.radius - a.radius)
      const total = landmarks.length
      return {
        landmarks: landmarks, //.slice(0, limit),
        isLimited: true,
        total,
        bounds: getBounds(landmarks),
      }
    },
  )

  public hasMap = selectSignal(this.mapIds, (it) => !!it?.length)

  protected iconExpand = svgExpand
  protected elRef = inject(ElementRef<HTMLElement>)
  private document = injectDocument()

  protected toggleFullscreen() {
    if (this.document.fullscreenElement) {
      this.document.exitFullscreen()
    } else {
      this.elRef.nativeElement.requestFullscreen()
    }
  }

  protected toggleSize(size: string) {
    const disabledSizes = this.disabledSizes()
    if (disabledSizes.includes(size)) {
      this.disabledSizes.set(disabledSizes.filter((it) => it !== size))
    } else {
      this.disabledSizes.set([...disabledSizes, size])
    }
  }

  // public spawns = computed(() => {
  //   const data = this.data()
  //   const size = this.gatherableSize()
  //   const mapId = this.mapId()
  //   const gatherable = this.gatherable()
  //   if (!data || !mapId || !data[mapId] || !gatherable) {
  //     return null
  //   }
  //   const points = data[mapId]?.[size]?.map((it: MapPointMarker) => it.point)
  //   return {
  //     gatherableID: gatherable.GatherableID,
  //     mapID: mapId,
  //     size: size,
  //     points: points,
  //   }
  // })
  // protected downloadPositions() {
  //   const data = this.spawns()
  //   const fileName = `${this.gatherableId}.json`
  //   const object = {
  //     gatherableID: this.gatherableId,
  //     points: data.points,
  //   }
  //   const blob = new Blob([JSON.stringify(object, null, 2)], {
  //     type: 'application/json',
  //   })
  //   saveBlobToFile(blob, fileName)
  // }
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

async function saveBlobToFile(blob: Blob, filename: string) {
  const showSaveFilePicker = window['showSaveFilePicker'] as any
  if (!showSaveFilePicker) {
    return saveAs(blob, filename)
  }

  const handle = await showSaveFilePicker({
    suggestedName: filename,
  })
  if (await verifyPermission(handle)) {
    await writeFile(handle, blob)
  }
}

async function writeFile(fileHandle, contents: Blob) {
  const writable = await fileHandle.createWritable()
  await writable.write(contents)
  await writable.close()
}

async function verifyPermission(fileHandle) {
  const options = {
    mode: 'readwrite',
  }
  // Check if permission was already granted. If so, return true.
  if ((await fileHandle.queryPermission(options)) === 'granted') {
    return true
  }
  // Request permission. If the user grants permission, return true.
  if ((await fileHandle.requestPermission(options)) === 'granted') {
    return true
  }
  // The user didn't grant permission, so return false.
  return false
}
