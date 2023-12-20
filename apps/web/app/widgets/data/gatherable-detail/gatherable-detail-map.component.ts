import { Component, ElementRef, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { GatherableNodeSize, getGatherableNodeSize } from '@nw-data/common'
import { Spawns } from '@nw-data/generated'
import { TranslateService } from '~/i18n'
import { NwDbService, NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgCircleExclamation, svgCompress, svgExpand } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { eqCaseInsensitive, selectSignal } from '~/utils'
import { LandMapComponent, Landmark } from '~/widgets/land-map'
import { GatherableDetailStore } from './gatherable-detail.store'
import { DecimalPipe } from '@angular/common'
import { OverlayModule } from '@angular/cdk/overlay'
import { LayoutModule } from '~/ui/layout'

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
  imports: [DecimalPipe, NwModule, LandMapComponent, TooltipModule, FormsModule, OverlayModule, LayoutModule, IconsModule],
  providers: [DecimalPipe],
  host: {
    class: 'block relative',
    '[hidden]': '!hasMap()',
  },
})
export class GatherableDetailMapComponent {
  protected db = inject(NwDbService)
  protected store = inject(GatherableDetailStore)
  protected tl8 = inject(TranslateService)

  protected data = selectSignal(
    {
      gatherables: this.store.siblings$,
      gatherablesMeta: this.store.gatherableMeta$,
      variations: this.store.siblingsVariations$,
      variationsMeta: this.store.variationsMetadata$,
      chunks: this.store.variationsMetaChunks$,
    },
    ({ gatherables, gatherablesMeta, variations, variationsMeta, chunks }) => {
      if (!gatherables?.length) {
        return null
      }
      variations ??= []
      variationsMeta ??= []
      chunks ??= []

      const result: Record<string, Record<string, Landmark[]>> = {}

      if (gatherablesMeta) {
        const gatherable = gatherables.find((it) => eqCaseInsensitive(it.GatherableID, gatherablesMeta.gatherableID))
        if (gatherable) {
          const size = getGatherableNodeSize(gatherable.GatherableID) || ('Nodes' as GatherableNodeSize)
          const name = this.tl8.get(gatherable.DisplayName)

          for (const mapId in gatherablesMeta.spawns || {}) {
            const spawns = gatherablesMeta.spawns[mapId as keyof Spawns]
            for (const spawn of spawns || []) {
              result[mapId] ??= {}
              result[mapId][size] ??= []
              result[mapId][size].push({
                title: `${name}<br/>x:${spawn[0].toFixed(2)} y:${spawn[1].toFixed(2)}`,
                color: SIZE_COLORS[size] || SIZE_COLORS.Medium,
                outlineColor: SIZE_OUTLINE[size] || SIZE_OUTLINE.Medium,
                point: spawn,
                radius: SIZE_RADIUS[size] || SIZE_RADIUS.Medium,
              })
            }
          }
        }
      }

      for (const meta of variationsMeta) {
        const variant = variations.find((it) => it.VariantID === meta.variantID)
        if (!variant) {
          continue
        }
        const gatherable = gatherables.find((it) =>
          eqCaseInsensitive(it.GatherableID, variant.GatherableEntryID || variant.GatherableEntryId),
        )
        if (!gatherable) {
          continue
        }

        const size = getGatherableNodeSize(gatherable.GatherableID) || ('Nodes' as GatherableNodeSize)
        const name = this.tl8.get(gatherable.DisplayName)
        for (const entry of meta.variantPositions || []) {
          if (!entry?.elementCount) {
            continue
          }
          const chunk = chunks.find((it) => it.chunk === entry.chunk)
          if (!chunk) {
            continue
          }
          const positions = chunk.data.slice(entry.elementOffset, entry.elementOffset + entry.elementCount)
          const mapId = entry.mapId
          for (const position of positions || []) {
            if (!position) {
              continue
            }
            result[mapId] ??= {}
            result[mapId][size] ??= []
            result[mapId][size].push({
              title: `${name}<br/>x:${position[0].toFixed(2)} y:${position[1].toFixed(2)}`,
              color: SIZE_COLORS[size],
              outlineColor: SIZE_OUTLINE[size] || SIZE_OUTLINE.Medium,
              point: position,
              radius: SIZE_RADIUS[size] || SIZE_RADIUS.Medium,
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

  protected limit = signal<number>(5000)
  protected availableLimits = [5000, 10000, 25000, 50000, 75000, 100000, 150000, 0]
  protected vm = selectSignal({
    mapId: this.mapId,
    data: this.data,
    disabledSizes: this.disabledSizes,
    limit: this.limit,
  }, ({ mapId, data, disabledSizes, limit }) => {
    if (!data || !mapId || !data[mapId]) {
      return null
    }
    const result = {
      ...(data[mapId] || {})
    }
    for (const size of disabledSizes) {
      delete result[size]
    }
    const landmarks = Object.values(result).flat()
    if (!!limit && (landmarks.length <= limit)) {
      return {
        landmarks,
        isLimited: false,
        shown: landmarks.length,
        total: landmarks.length,
      }
    }
    const total = landmarks.length
    return {
      landmarks: landmarks.slice(0, limit),
      isLimited: true,
      shown: limit,
      total,
    }
  })

  public hasMap = selectSignal(this.mapIds, (it) => !!it?.length)

  protected iconExpand = svgExpand
  protected iconCompress = svgCompress
  protected iconWarning = svgCircleExclamation
  protected elRef = inject(ElementRef<HTMLElement>)

  protected toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen()
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
}
