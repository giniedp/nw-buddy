import { Component, ElementRef, inject, signal } from '@angular/core'
import { GatherableNodeSize, getGatherableNodeSize } from '@nw-data/common'
import { Gatherables, GatherablesMetadata, Spawns, VariationsGatherables, VariationsMetadata } from '@nw-data/generated'
import { TranslateService } from '~/i18n'
import { NwDbService, NwModule } from '~/nw'
import { TooltipModule } from '~/ui/tooltip'
import { selectSignal } from '~/utils'
import { LandMapComponent, Landmark } from '~/widgets/land-map'
import { GatherableDetailStore } from './gatherable-detail.store'
import { FormsModule } from '@angular/forms'
import { svgCompress, svgExpand } from '~/ui/icons/svg'
import { IconsModule } from '~/ui/icons'

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
  imports: [NwModule, LandMapComponent, TooltipModule, FormsModule, IconsModule],
  host: {
    class: 'block rounded-md overflow-clip relative',
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
      metaMap: this.db.gatherablesMetadataMap,
      variationsMap: this.db.gatherableVariationsByGatherableIdMap,
      variationsMetaMap: this.db.variationsMetadataMap,
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

  protected availableSizes = selectSignal(
    {
      data: this.data,
      mapId: this.mapId,
    },
    ({ data, mapId }) => {
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
          }
        })
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
      return Object.values(data[mapId] || {}).flat()
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
    gatherables,
    metaMap,
    variationsMap,
    variationsMetaMap,
  }: {
    gatherables: Gatherables[]
    metaMap: Map<string, GatherablesMetadata>
    variationsMap: Map<string, Set<VariationsGatherables>>
    variationsMetaMap: Map<string, VariationsMetadata>
  },
  tl8: TranslateService,
) {
  const result: Record<string, Record<string, Landmark[]>> = {}
  if (!gatherables?.length || !metaMap || !variationsMap || !variationsMetaMap) {
    return result
  }
  for (const gatherable of gatherables) {
    const meta = metaMap.get(gatherable.GatherableID)
    const variations = Array.from(variationsMap.get(gatherable.GatherableID) || []).filter((it) => !!it)
    const variationsMeta = variations.map((it) => variationsMetaMap.get(it.VariantID)).filter((it) => !!it)
    const size = getGatherableNodeSize(gatherable.GatherableID) || ('Nodes' as GatherableNodeSize)
    const name = tl8.get(gatherable.DisplayName) + (size ? ` - ${size}` : '')

    for (const mapId of meta?.mapIDs || []) {
      for (const spawn of meta.spawns[mapId as keyof Spawns] || []) {
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
    for (const { mapIDs, spawns } of variationsMeta || []) {
      for (const mapId of mapIDs || []) {
        for (const spawn of spawns[mapId as keyof Spawns] || []) {
          result[mapId] ??= {}
          result[mapId][size] ??= []
          result[mapId][size].push({
            title: `${name}<br/>x:${spawn[0].toFixed(2)} y:${spawn[1].toFixed(2)}`,
            color: SIZE_COLORS[size],
            outlineColor: SIZE_OUTLINE[size] || SIZE_OUTLINE.Medium,
            point: spawn,
            radius: SIZE_RADIUS[size] || SIZE_RADIUS.Medium,
          })
        }
      }
    }
  }
  for (const mapId in result) {
    for (const size in result[mapId]) {
      {
        result[mapId][size].sort((a, b) => b.radius - a.radius)
      }
    }
  }
  return result
}
