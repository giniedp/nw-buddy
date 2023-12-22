import { Dialog } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, TemplateRef } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { getItemIconPath, getItemId } from '@nw-data/common'
import { ItemDefinitionMaster } from '@nw-data/generated'
import { uniq } from 'lodash'
import { map } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService, NwModule } from '~/nw'
import { LayoutModule } from '~/ui/layout'
import {
  HtmlHeadService,
  eqCaseInsensitive,
  mapList,
  observeRouteParam,
  selectSignal,
  selectStream,
  switchMapCombineLatest,
} from '~/utils'
import { GameEventDetailModule } from '~/widgets/data/game-event-detail'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { LootLimitDetailModule } from '~/widgets/data/loot-limit-detail'
import { LootModule } from '~/widgets/loot'
import { ModelViewerComponent } from '~/widgets/model-viewer'
import { ItemModelInfo } from '~/widgets/model-viewer/model-viewer.service'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  standalone: true,
  selector: 'nwb-loot-limit-detail-page',
  templateUrl: './loot-limit-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    NwModule,
    ItemDetailModule,
    ScreenshotModule,
    LayoutModule,
    LootModule,
    GameEventDetailModule,
    LootLimitDetailModule,
  ],
  host: {
    class: 'flex-none flex flex-col',
  },
})
export class LootLimitDetailPageComponent {
  protected limitId$ = observeRouteParam(this.route, 'id')
  protected itemId$ = selectStream(this.db.itemOrHousingItem(this.limitId$), (it) => getItemId(it))
  protected buckets$ = selectStream(
    {
      itemId: this.itemId$,
      buckets: this.db.lootBuckets,
    },
    ({ itemId, buckets }) => {
      const result = buckets?.filter((it) => eqCaseInsensitive(it.Item, itemId))
      return result?.length ? result : null
    },
  )

  protected itemId = selectSignal(this.itemId$)

  protected gameEventsByLootLimit$ = selectStream(this.db.gameEventsByLootLimitId(this.limitId$))
  protected gameEvents = selectSignal(
    {
      list1: this.gameEventsByLootLimit$,
      list2: this.gameEventsByLootLimit$.pipe(
        mapList((it) => it.LootLimitReachedGameEventId),
        map((list) => list?.filter((it) => !!it) || []),
        switchMapCombineLatest((it) => this.db.gameEvent(it)),
      ),
    },
    ({ list1, list2 }) => {
      list1 = list1 || []
      list2 = list2 || []
      return [...list1, ...list2]
    },
  )
  protected gameEventIds = selectSignal(this.gameEvents, (list) => {
    const result = uniq(list.map((it) => it.EventID))
    return result.length ? result : null
  })

  protected otherTableIds = selectSignal(
    {
      limitId: this.limitId$,
      itemId: this.itemId$,
      lootTables: this.db.lootTables,
      bucketIds: this.buckets$.pipe(mapList((it) => it.LootBucket)),
    },
    ({ limitId, itemId, lootTables, bucketIds }) => {
      if (!lootTables) {
        return null
      }
      limitId = `[LIM]${limitId}`
      let result: string[] = []
      for (const table of lootTables) {
        for (const item of table.Items) {
          if (limitId && item.LootLimitID === limitId) {
            result.push(table.LootTableID)
          } else if (itemId && item.ItemID === itemId) {
            result.push(table.LootTableID)
          } else if (item.LootBucketID && bucketIds?.includes(item.LootBucketID)) {
            result.push(table.LootTableID)
          }
        }
      }
      result = uniq(result)
      return result.length ? result : null
    },
  )

  protected eventTableIds = selectSignal(this.gameEvents, (list) => {
    let result: string[] = []
    list.forEach((it) => {
      if (it.ItemReward?.startsWith('[LTID]')) {
        result.push(it.ItemReward.slice(6))
      }
    })
    result = uniq(result)
    return result.length ? result : null
  })

  public constructor(
    private route: ActivatedRoute,
    private dialog: Dialog,
    private head: HtmlHeadService,
    private i18n: TranslateService,
    private db: NwDbService,
  ) {
    //
  }

  protected openViewer(models: ItemModelInfo[]) {
    ModelViewerComponent.open(this.dialog, {
      panelClass: ['w-full', 'h-full'],
      data: models,
    })
  }

  protected onEntity(entity: ItemDefinitionMaster) {
    if (!entity) {
      return
    }
    this.head.updateMetadata({
      title: this.i18n.get(entity.Name),
      description: this.i18n.get(entity.Description),
      url: this.head.currentUrl,
      image: `${this.head.origin}/${getItemIconPath(entity)}`,
    })
  }

  protected openRepairRecipe(tpl: TemplateRef<any>) {
    this.dialog.open(tpl, {
      panelClass: ['w-full', 'h-full', 'max-w-4xl', 'layout-pad', 'shadow'],
    })
  }

  protected closeDialog() {
    this.dialog.closeAll()
  }
}
