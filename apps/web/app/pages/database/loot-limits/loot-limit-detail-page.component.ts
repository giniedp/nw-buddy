import { Dialog } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, TemplateRef } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { getItemIconPath, getItemId } from '@nw-data/common'
import { ItemDefinitionMaster } from '@nw-data/generated'
import { uniq } from 'lodash'
import { map } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwModule } from '~/nw'
import { NwDataService } from '~/data'
import { LayoutModule } from '~/ui/layout'
import {
  HtmlHeadService,
  eqCaseInsensitive,
  injectRouteParam,
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
  protected limitId = toSignal(injectRouteParam('id'))
}
