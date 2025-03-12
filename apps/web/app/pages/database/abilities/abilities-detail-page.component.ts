import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { NW_MAX_CHARACTER_LEVEL, NW_MAX_GEAR_SCORE_BASE } from '@nw-data/common'
import { AbilityData } from '@nw-data/generated'
import { firstValueFrom } from 'rxjs'
import { injectNwData } from '~/data'

import { TranslateService } from '~/i18n'
import { NwModule } from '~/nw'
import { NwExpressionService } from '~/nw/expression'
import { LayoutModule } from '~/ui/layout'
import { PropertyGridModule } from '~/ui/property-grid'
import { apiResource, HtmlHeadService, observeRouteParam } from '~/utils'
import { AbilityDetailModule } from '~/widgets/data/ability-detail'
import { PerkDetailModule } from '~/widgets/data/perk-detail'
import { SpellDetailModule } from '~/widgets/data/spell-detail'
import { StatusEffectDetailModule } from '~/widgets/data/status-effect-detail'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  selector: 'nwb-abilities-detail-page',
  templateUrl: './abilities-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AbilityDetailModule,
    AbilityDetailModule,
    CommonModule,
    LayoutModule,
    NwModule,
    PerkDetailModule,
    PropertyGridModule,
    RouterModule,
    ScreenshotModule,
    StatusEffectDetailModule,
    SpellDetailModule,
  ],
  host: {
    class: 'block',
  },
})
export class AbilitiesDetailPageComponent {
  private db = injectNwData()

  public itemId = toSignal(observeRouteParam(this.route, 'id'))

  protected perkIds = apiResource({
    request: () => this.itemId(),
    loader: async ({ request }) =>
      this.db
        .perksByEquipAbility(request)
        .then((list) => list || [])
        .then((list) => list.map((it) => it.PerkID)),
  }).value

  protected spellIds = apiResource({
    request: () => this.itemId(),
    loader: async ({ request }) =>
      this.db
        .spellsByAbilityId(request)
        .then((list) => list || [])
        .then((list) => list.map((it) => it.SpellID)),
  }).value

  public constructor(
    private route: ActivatedRoute,
    private i18n: TranslateService,
    private expr: NwExpressionService,
    private head: HtmlHeadService,
  ) {
    //
  }

  protected async onEntity(entity: AbilityData) {
    if (!entity) {
      return
    }
    const description = await firstValueFrom(
      this.expr.solve({
        charLevel: NW_MAX_CHARACTER_LEVEL,
        gearScore: NW_MAX_GEAR_SCORE_BASE,
        text: this.i18n.get(entity.Description),
        itemId: entity.AbilityID,
      }),
    )
    this.head.updateMetadata({
      title: [this.i18n.get(entity.DisplayName), 'Ability'].join(' - '),
      description: description,
      url: this.head.currentUrl,
      image: entity.Icon,
    })
  }
}
