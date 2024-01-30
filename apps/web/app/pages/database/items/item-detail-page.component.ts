import { animate, style, transition, trigger } from '@angular/animations'
import { Dialog } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, TemplateRef } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { RouterModule } from '@angular/router'
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
import { TooltipModule } from '~/ui/tooltip'
import { HtmlHeadService, injectRouteParam } from '~/utils'
import { GameEventDetailModule } from '~/widgets/data/game-event-detail'
import { ItemDetailModule } from '~/widgets/data/item-detail'
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
    ScreenshotModule,
    LootModule,
    IconsModule,
    ModelViewerModule,
    TooltipModule,
    GameEventDetailModule,
    ItemTabsComponent
  ],
  providers: [],
  host: {
    class: 'block',
  },
  animations: [
    trigger('appear', [
      transition(':enter', [
        style({ height: 0, opacity: 0 }),
        animate('0.15s ease-out', style({ height: '*' })),
        animate('0.15s ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        style({ height: '*', opacity: '*' }),
        animate('0.15s ease-out', style({ opacity: 0 })),
        animate('0.15s ease-out', style({ height: 0 })),
      ]),
    ]),
  ],
})
export class ItemDetailPageComponent {
  protected itemId$ = injectRouteParam('id')
  protected itemId = toSignal(this.itemId$)

  protected iconLink = svgSquareArrowUpRight
  protected viewerActive = false
  public constructor(
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
    if (!item?.Tier) {
      return null
    }
    return 'Tier ' + getItemTierAsRoman(item.Tier)
  }
}
