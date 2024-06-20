import { OverlayModule } from '@angular/cdk/overlay'
import { DecimalPipe } from '@angular/common'
import { Component, ElementRef, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { LoreMetadata, LoreSpawns, LoreData } from '@nw-data/generated'
import { NwDataService } from '~/data'
import { TranslateService } from '~/i18n'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgCircleExclamation, svgCompress, svgExpand } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { eqCaseInsensitive, selectSignal } from '~/utils'
import { MapPointMarker, WorldMapComponent } from '~/widgets/world-map'
import { LoreItemDetailStore } from './lore-item-detail.store'

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
  selector: 'nwb-lore-item-detail-map',
  templateUrl: './lore-item-detail-map.component.html',
  imports: [
    DecimalPipe,
    NwModule,
    WorldMapComponent,
    TooltipModule,
    FormsModule,
    OverlayModule,
    LayoutModule,
    IconsModule,
  ],
  providers: [DecimalPipe],
  host: {
    class: 'block relative',
    '[hidden]': '!hasMap()',
  },
})
export class LoreItemDetailMapComponent {
  protected db = inject(NwDataService)
  protected store = inject(LoreItemDetailStore)
  protected tl8 = inject(TranslateService)

  protected data = selectSignal(
    {
      record: this.store.record$,
      loreItems: this.db.loreItems,
      loreMetaMap: this.db.loreItemsMetaMap,
    },
    ({ record, loreItems, loreMetaMap }) => {
      if (!record || !loreItems || !loreMetaMap) {
        return null
      }
      const result = selectLoreData(record, loreItems, loreMetaMap)
      for (const mapId in result) {
        for (const entry of result[mapId]) {
          entry.title = this.tl8.get(entry.title)
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

  protected landmarks = selectSignal(
    {
      mapId: this.mapId,
      data: this.data,
    },
    ({ mapId, data }) => {
      if (!data || !mapId || !data[mapId]) {
        return null
      }
      return data[mapId]
    },
  )

  protected bounds = computed(() => {
    let min: number[] = null
    let max: number[] = null
    for (const item of this.landmarks() || []) {
      const point = item.point
      if (!point) {
        continue
      }
      if (!min) {
        min = [...point]
        max = [...point]
      } else {
        min[0] = Math.min(min[0], point[0])
        min[1] = Math.min(min[1], point[1])
        max[0] = Math.max(max[0], point[0])
        max[1] = Math.max(max[1], point[1])
      }
    }
    if (min && max) {
      return { min, max }
    }
    return null
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
}

function selectLoreData(lore: LoreData, loreItems: LoreData[], metaMap: Map<string, LoreMetadata>) {
  const root = selectRoot(lore, loreItems)
  const tree = selectTree(root, loreItems)
  const list = selectTreeList(tree)
  const result: Record<string, MapPointMarker[]> = {}
  for (const entry of list) {
    const meta = metaMap.get(entry.LoreID)
    if (!meta) {
      continue
    }
    const emphasis = lore.Type === 'Topic' || lore.LoreID === entry.LoreID || lore.LoreID === entry.ParentID
    for (const mapId in meta.loreSpawns || {}) {
      const spawns = meta.loreSpawns[mapId as keyof LoreSpawns]
      for (const spawn of spawns || []) {
        result[mapId] ??= []
        result[mapId].push({
          title: entry.Title,
          point: spawn,
          color: emphasis ? SIZE_COLORS.Emphasis : SIZE_COLORS.Common,
          outlineColor: emphasis ? SIZE_OUTLINE.Emphasis : SIZE_OUTLINE.Common,
          opacity: emphasis ? 1 : 0.5,
          radius: emphasis ? 5 : 5,
        })
      }
    }
  }
  for (const mapId in result) {
    result[mapId] = result[mapId].sort((a, b) => {
      return a.opacity - b.opacity
    })
  }
  return result
}

interface LoreTree {
  lore: LoreData
  children: LoreTree[]
}

function selectRoot(lore: LoreData, loreItems: LoreData[]) {
  while (lore?.ParentID) {
    lore = loreItems.find((it) => eqCaseInsensitive(it.LoreID, lore.ParentID))
  }
  return lore
}

function selectTree(lore: LoreData, loreItems: LoreData[]): LoreTree {
  return {
    lore: lore,
    children: loreItems
      .filter((it) => eqCaseInsensitive(it.ParentID, lore.LoreID))
      .map((it) => selectTree(it, loreItems)),
  }
}

function selectTreeList(tree: LoreTree, result: LoreData[] = []) {
  result.push(tree.lore)
  for (const child of tree.children) {
    selectTreeList(child, result)
  }
  return result
}
