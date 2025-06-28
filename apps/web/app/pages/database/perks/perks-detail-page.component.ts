import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { NW_MAX_CHARACTER_LEVEL, NW_MAX_GEAR_SCORE_BASE } from '@nw-data/common'
import { PerkData } from '@nw-data/generated'
import { firstValueFrom } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwModule } from '~/nw'
import { NwExpressionService } from '~/nw/expression'
import { CodeEditorModule } from '~/ui/code-editor'
import { LayoutModule } from '~/ui/layout'
import { PropertyGridModule } from '~/ui/property-grid'
import { HtmlHeadService, observeRouteParam } from '~/utils'
import { AbilityDetailModule } from '~/widgets/data/ability-detail'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { PerkDetailModule } from '~/widgets/data/perk-detail'
import { StatusEffectDetailModule } from '~/widgets/data/status-effect-detail'
import { ScreenshotModule } from '~/widgets/screenshot'
import { DiffButtonComponent } from '../../../widgets/diff-tool/diff-button.component'

@Component({
  selector: 'nwb-perks-detail-page',
  templateUrl: './perks-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AbilityDetailModule,
    StatusEffectDetailModule,
    CommonModule,
    LayoutModule,
    NwModule,
    PerkDetailModule,
    PropertyGridModule,
    RouterModule,
    ScreenshotModule,
    ItemDetailModule,
    CodeEditorModule,
    FormsModule,
  ],
  host: {
    class: 'block',
  },
})
export class PerksDetailPageComponent {
  public itemId = toSignal(observeRouteParam(this.route, 'id'))

  public constructor(
    private route: ActivatedRoute,
    private i18n: TranslateService,
    private head: HtmlHeadService,
    private expr: NwExpressionService,
  ) {
    //
  }

  protected async onEntity(entity: PerkData) {
    if (!entity) {
      return
    }
    const description = await firstValueFrom(
      this.expr.solve({
        charLevel: NW_MAX_CHARACTER_LEVEL,
        gearScore: NW_MAX_GEAR_SCORE_BASE,
        text: this.i18n.get(entity.Description),
        itemId: entity.PerkID,
      }),
    )
    this.head.updateMetadata({
      title: [this.i18n.get(entity.DisplayName), entity.PerkType].join(' - '),
      description: description,
      url: this.head.currentUrl,
      image: entity.IconPath,
    })
  }
}
