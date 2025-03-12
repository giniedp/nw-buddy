import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { RouterModule } from '@angular/router'
import {
  getItemIconPath,
  getItemRarity,
  getItemRarityLabel,
  getItemTierAsRoman,
  getItemVersionString,
  isItemNamed,
} from '@nw-data/common'
import { MasterItemDefinitions } from '@nw-data/generated'
import { switchMap } from 'rxjs'
import { injectNwData } from '~/data'
import { TranslateService } from '~/i18n'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgSquareArrowUpRight } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { HtmlHeadService, injectRouteParam } from '~/utils'
import { ConsumableDetailModule } from '~/widgets/data/consumable-detail'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { LootModule } from '~/widgets/loot'
import { ModelsService } from '~/widgets/model-viewer'
import { ScreenshotModule } from '~/widgets/screenshot'
import { ItemTabsComponent } from './item-tabs.component'
import { ItemDetailModelViewerComponent } from './ui/item-detail-model-viewer.component'
import { ItemDetailSalvageInfoComponent } from './ui/item-detail-salvage-info.component'

@Component({
  selector: 'nwb-item-detail-page',
  templateUrl: './item-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    NwModule,
    ItemDetailModule,
    ScreenshotModule,
    LootModule,
    LayoutModule,
    IconsModule,
    TooltipModule,
    ItemTabsComponent,
    ConsumableDetailModule,
    ItemDetailSalvageInfoComponent,
    ItemDetailModelViewerComponent,
  ],
  providers: [],
  host: {
    class: 'block',
  },
})
export class ItemDetailPageComponent {
  private ms = inject(ModelsService)
  private db = injectNwData()
  protected itemId$ = injectRouteParam('id')
  protected itemId = toSignal(this.itemId$)

  protected iconLink = svgSquareArrowUpRight
  protected viewerActive = false
  protected models$ = this.ms.byItemId(toObservable(this.itemId))
  protected consumable$ = this.itemId$.pipe(switchMap((id) => this.db.consumableItemsById(id)))

  public constructor(
    private head: HtmlHeadService,
    private i18n: TranslateService,
  ) {
    //
  }

  protected onEntity(entity: MasterItemDefinitions) {
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

  protected itemRarity(item: MasterItemDefinitions) {
    return getItemRarity(item)
  }
  protected itemRarityLabel(item: MasterItemDefinitions) {
    return getItemRarityLabel(getItemRarity(item))
  }
  protected itemNamed(item: MasterItemDefinitions) {
    return isItemNamed(item)
  }
  protected itemVersion(item: MasterItemDefinitions) {
    return getItemVersionString(item)
  }
  protected itemTier(item: MasterItemDefinitions) {
    if (!item?.Tier) {
      return null
    }
    return 'Tier ' + getItemTierAsRoman(item.Tier)
  }
}
