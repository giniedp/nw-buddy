import { Dialog } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, TemplateRef } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import {
  getItemIconPath,
  getItemRarity,
  getItemRarityLabel,
  getItemTierAsRoman,
  getItemVersionString,
  isItemNamed,
} from '@nw-data/common'
import { ItemDefinitionMaster } from '@nw-data/generated'
import { TranslateService } from '~/i18n'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgSquareArrowUpRight } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { HtmlHeadService, observeRouteParam } from '~/utils'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { PerkDetailModule } from '~/widgets/data/perk-detail'
import { StatusEffectDetailModule } from '~/widgets/data/status-effect-detail'
import { LootModule } from '~/widgets/loot'
import { ModelViewerComponent, ModelViewerModule } from '~/widgets/model-viewer'
import { ItemModelInfo } from '~/widgets/model-viewer/model-viewer.service'
import { ScreenshotModule } from '~/widgets/screenshot'
import { ItemTabsComponent } from './item-tabs.component'

@Component({
  standalone: true,
  selector: 'nwb-item-detail-page',
  templateUrl: './item-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    NwModule,
    ItemDetailModule,
    StatusEffectDetailModule,
    PerkDetailModule,
    ScreenshotModule,
    LayoutModule,
    LootModule,
    ItemTabsComponent,
    ItemFrameModule,
    IconsModule,
    ModelViewerModule,
    TooltipModule,
  ],
  providers: [],
  host: {
    class: 'flex-none flex flex-col',
  },
})
export class ItemDetailPageComponent {
  protected itemId$ = observeRouteParam(this.route, 'id')

  protected iconLink = svgSquareArrowUpRight
  protected viewerActive = false
  public constructor(
    private route: ActivatedRoute,
    private dialog: Dialog,
    private head: HtmlHeadService,
    private i18n: TranslateService,
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

  protected itemRarity(item: ItemDefinitionMaster) {
    return getItemRarity(item)
  }
  protected itemRarityLabel(item: ItemDefinitionMaster) {
    return getItemRarityLabel(getItemRarity(item))
  }
  protected itemNamed(item: ItemDefinitionMaster) {
    return isItemNamed(item)
  }
  protected itemVersion(item: ItemDefinitionMaster) {
    return getItemVersionString(item)
  }
  protected itemTier(item: ItemDefinitionMaster) {
    return 'Tier ' + getItemTierAsRoman(item.Tier)
  }
}
