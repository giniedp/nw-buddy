import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { SpellData, StatusEffectData } from '@nw-data/generated'
import { firstValueFrom } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwModule } from '~/nw'
import { NwExpressionService } from '~/nw/expression'
import { NW_MAX_CHARACTER_LEVEL, NW_MAX_GEAR_SCORE_BASE } from '@nw-data/common'
import { LayoutModule } from '~/ui/layout'
import { PropertyGridModule } from '~/ui/property-grid'
import { HtmlHeadService, observeRouteParam } from '~/utils'
import { AbilityDetailModule } from '~/widgets/data/ability-detail'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { PerkDetailModule } from '~/widgets/data/perk-detail'
import { ScreenshotModule } from '~/widgets/screenshot'
import { StatusEffectDetailModule } from '~/widgets/data/status-effect-detail'
import { DamageRowDetailModule } from '~/widgets/data/damage-detail'
import { SpellDetailModule } from '~/widgets/data/spell-detail'

@Component({
  selector: 'nwb-spells-detail-page',
  templateUrl: './spells-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AbilityDetailModule,
    CommonModule,
    LayoutModule,
    NwModule,
    PropertyGridModule,
    RouterModule,
    ScreenshotModule,
    StatusEffectDetailModule,
    PerkDetailModule,
    ItemDetailModule,
    DamageRowDetailModule,
    SpellDetailModule,
  ],
  host: {
    class: 'block',
  },
})
export class SpellsDetailPageComponent {
  public recordId = observeRouteParam(this.route, 'id')

  public constructor(
    private route: ActivatedRoute,
    private i18n: TranslateService,
    private head: HtmlHeadService,
  ) {
    //
  }

  protected async onEntity(entity: SpellData) {
    if (!entity) {
      return
    }
    this.head.updateMetadata({
      title: [this.i18n.get(entity.SpellID)].join(' - '),
      description: '',
      url: this.head.currentUrl,
      image: '',
    })
  }
}
