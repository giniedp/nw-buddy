import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { RouterModule } from '@angular/router'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { ItemFrameModule } from '~/ui/item-frame'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { injectRouteParam } from '~/utils'
import { GatherableDetailModule } from '~/widgets/data/gatherable-detail'
import { NpcDetailModule } from '~/widgets/data/npc-detail'
import { LootModule } from '~/widgets/loot'
import { ModelsService, ModelViewerModule } from '~/widgets/model-viewer'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  selector: 'nwb-npcs-detail-page',
  templateUrl: './npcs-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    NwModule,
    ScreenshotModule,
    LootModule,
    IconsModule,
    TooltipModule,
    GatherableDetailModule,
    LayoutModule,
    ItemFrameModule,
    ModelViewerModule,
    NpcDetailModule,
  ],
  providers: [],
  host: {
    class: 'block',
  },
})
export class NpcDetailPageComponent {
  protected db = injectNwData()
  protected viewerService = inject(ModelsService)
  protected itemId = toSignal(injectRouteParam('id'))
  // protected npc$ = selectStream(this.db.npc(this.itemId$))
  // protected data = selectSignal(this.db.npc(this.itemId$))
  // protected variations = selectSignal(this.db.npcsVariationsByNpcId(this.itemId$), (it) => it || [])
  // protected variationsMeta$ = selectStream(
  //   {
  //     npc: this.db.npc(this.itemId$),
  //     variations: this.db.npcsVariationsByNpcId(this.itemId$),
  //     metadataMap: this.db.variationsMetadataMap,
  //   },
  //   ({ npc, variations, metadataMap }) => {
  //     if (!npc || !variations || !metadataMap) {
  //       return null
  //     }
  //     return Array.from(variations)
  //       .map((variation) => {
  //         return metadataMap.get(variation.VariantID)
  //       })
  //       .filter((it) => !!it)
  //   },
  // )
  // protected variationsMetaChunks$ = selectStream(
  //   this.variationsMeta$.pipe(
  //     switchMap((list) => {
  //       if (!list) {
  //         return of(null)
  //       }
  //       const chunkIds = uniq(list.map((it) => it.variantPositions.map((chunk) => chunk.chunk)).flat())
  //       const chunks = combineLatestOrEmpty(
  //         chunkIds.map((it) => {
  //           return combineLatest({
  //             chunk: of(it),
  //             data: this.db.variationsChunk(it),
  //           })
  //         }),
  //       )
  //       return chunks
  //     }),
  //   ),
  // )

  // protected positions$ = selectStream(
  //   {
  //     variationsMeta: this.variationsMeta$,
  //     chunks: this.variationsMetaChunks$,
  //   },
  //   ({ variationsMeta, chunks }) => {
  //     const result: Record<string, MapMarker[]> = {}
  //     if (!chunks || !variationsMeta) {
  //       return result
  //     }
  //     for (const meta of variationsMeta || []) {
  //       for (const entry of meta.variantPositions) {
  //         const mapId = entry.mapId
  //         if (!entry?.elementCount) {
  //           continue
  //         }
  //         const chunk = chunks.find((it) => it.chunk === entry.chunk)
  //         if (!chunk) {
  //           continue
  //         }
  //         const positions = chunk.data.slice(entry.elementOffset, entry.elementOffset + entry.elementCount)
  //         for (const position of positions || []) {
  //           if (!position) {
  //             continue
  //           }
  //           result[mapId] ??= []
  //           result[mapId].push({
  //             title: `x:${position[0].toFixed(2)} y:${position[1].toFixed(2)}`,
  //             color: '#ff0000',
  //             // color: SIZE_COLORS[size],
  //             // outlineColor: SIZE_OUTLINE[size] || SIZE_OUTLINE.Medium,
  //             point: position,
  //             // radius: SIZE_RADIUS[size] || SIZE_RADIUS.Medium,
  //           })
  //         }
  //       }
  //     }
  //     return result
  //   },
  // )
  // protected mapIds = selectSignal(this.positions$, (it) => Object.keys(it || {}))
  // protected fallbackMapId = selectSignal(this.mapIds, (it) => it?.[0])
  // protected selectedMapId = signal<string>(null)
  // protected mapId = selectSignal(
  //   {
  //     selected: this.selectedMapId,
  //     fallback: this.fallbackMapId,
  //     mapIds: this.mapIds,
  //   },
  //   ({ selected, fallback, mapIds }) => {
  //     let result = selected ?? fallback
  //     if (result && !mapIds.includes(result)) {
  //       result = fallback
  //     }
  //     return result
  //   },
  // )

  // protected models = selectSignal(this.viewerService.byNpcId(this.itemId$), (list) => {
  //   return list?.length ? list : null
  // })

  // protected icon = NW_FALLBACK_ICON
  // protected iconLink = svgSquareArrowUpRight
  // protected viewerActive = false
  // public constructor(
  //   private route: ActivatedRoute,
  //   private head: HtmlHeadService,
  //   private i18n: TranslateService,
  // ) {
  //   //
  // }

  // protected onEntity(entity: MasterItemDefinitions) {
  //   if (!entity) {
  //     return
  //   }
  //   this.head.updateMetadata({
  //     title: this.i18n.get(entity.Name),
  //     description: this.i18n.get(entity.Description),
  //     url: this.head.currentUrl,
  //     image: `${this.head.origin}/${getItemIconPath(entity)}`,
  //   })
  // }
}
