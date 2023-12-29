import { OverlayModule } from '@angular/cdk/overlay'
import { DecimalPipe } from '@angular/common'
import { Component, ElementRef, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { GatherableNodeSize } from '@nw-data/common'
import { LoreMetadata, LoreSpawns, Loreitems } from '@nw-data/generated'
import { TranslateService } from '~/i18n'
import { NwDbService, NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgCircleExclamation, svgCompress, svgExpand } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { eqCaseInsensitive, selectSignal } from '~/utils'
import { LandMapComponent, LandmarkPoint } from '~/widgets/land-map'
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
    LandMapComponent,
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
  protected db = inject(NwDbService)
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

function selectLoreData(lore: Loreitems, loreItems: Loreitems[], metaMap: Map<string, LoreMetadata>) {
  const root = selectRoot(lore, loreItems)
  const tree = selectTree(root, loreItems)
  const list = selectTreeList(tree)
  const result: Record<string, LandmarkPoint[]> = {}
  for (const entry of list) {
    const meta = metaMap.get(entry.LoreID)
    if (!meta) {
      continue
    }
    const emphasis = lore.LoreID === entry.LoreID || lore.LoreID === entry.ParentID
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
  return result
}

interface LoreTree {
  lore: Loreitems
  children: LoreTree[]
}

function selectRoot(lore: Loreitems, loreItems: Loreitems[]) {
  while (lore?.ParentID) {
    lore = loreItems.find((it) => eqCaseInsensitive(it.LoreID, lore.ParentID))
  }
  return lore
}

function selectTree(lore: Loreitems, loreItems: Loreitems[]): LoreTree {
  return {
    lore: lore,
    children: loreItems
      .filter((it) => eqCaseInsensitive(it.ParentID, lore.LoreID))
      .map((it) => selectTree(it, loreItems)),
  }
}

function selectTreeList(tree: LoreTree, result: Loreitems[] = []) {
  result.push(tree.lore)
  for (const child of tree.children) {
    selectTreeList(child, result)
  }
  return result
}
