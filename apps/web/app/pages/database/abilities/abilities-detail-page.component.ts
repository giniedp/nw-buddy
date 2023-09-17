import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { Ability } from '@nw-data/generated'
import { firstValueFrom, map } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService, NwModule } from '~/nw'
import { NwExpressionService } from '~/nw/expression'
import { NW_MAX_CHARACTER_LEVEL, NW_MAX_GEAR_SCORE_BASE } from '@nw-data/common'
import { LayoutModule } from '~/ui/layout'
import { PropertyGridModule } from '~/ui/property-grid'
import { HtmlHeadService, observeRouteParam } from '~/utils'
import { AbilityDetailModule } from '~/widgets/data/ability-detail'
import { PerkDetailModule } from '~/widgets/data/perk-detail'
import { SpellDetailModule } from '~/widgets/data/spell-detail'
import { StatusEffectDetailModule } from '~/widgets/data/status-effect-detail'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  standalone: true,
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
    class: 'flex-none flex flex-col',
  },
})
export class AbilitiesDetailPageComponent {
  public itemId = observeRouteParam(this.route, 'id')

  protected perkIds$ = this.db
    .perksByEquipAbility(this.itemId)
    .pipe(map((set) => Array.from(set?.values() || [])))
    .pipe(map((list) => list.map((it) => it.PerkID)))

  public constructor(
    private route: ActivatedRoute,
    private i18n: TranslateService,
    private expr: NwExpressionService,
    private head: HtmlHeadService,
    private db: NwDbService
  ) {
    //
  }

  protected async onEntity(entity: Ability) {
    if (!entity) {
      return
    }
    const description = await firstValueFrom(
      this.expr.solve({
        charLevel: NW_MAX_CHARACTER_LEVEL,
        gearScore: NW_MAX_GEAR_SCORE_BASE,
        text: this.i18n.get(entity.Description),
        itemId: entity.AbilityID,
      })
    )
    this.head.updateMetadata({
      title: [this.i18n.get(entity.DisplayName), 'Ability'].join(' - '),
      description: description,
      url: this.head.currentUrl,
      image: entity.Icon,
    })
  }
}
