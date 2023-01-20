import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { Perks } from '@nw-data/types'
import { firstValueFrom, skip } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwModule } from '~/nw'
import { NwExpressionService } from '~/nw/expression'
import { NW_MAX_CHARACTER_LEVEL, NW_MAX_GEAR_SCORE_BASE } from '~/nw/utils/constants'
import { LayoutModule } from '~/ui/layout'
import { PropertyGridModule } from '~/ui/property-grid'
import { HtmlHeadService, observeRouteParam } from '~/utils'
import { AbilityDetailModule } from '~/widgets/ability-detail'
import { PerkDetailModule } from '~/widgets/perk-detail'

@Component({
  standalone: true,
  selector: 'nwb-perks-detail-page',
  templateUrl: './perks-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    RouterModule,
    PerkDetailModule,
    PropertyGridModule,
    LayoutModule,
    AbilityDetailModule,
  ],
  host: {
    class: 'flex-none flex flex-col',
  },
})
export class PerksDetailComponent {
  public itemId = observeRouteParam(this.route, 'id')

  public constructor(
    private route: ActivatedRoute,
    private i18n: TranslateService,
    private head: HtmlHeadService,
    private expr: NwExpressionService
  ) {
    //
  }

  protected async onEntity(entity: Perks) {
    if (!entity) {
      return
    }
    const description = await firstValueFrom(
      this.expr.solve({
        charLevel: NW_MAX_CHARACTER_LEVEL,
        gearScore: NW_MAX_GEAR_SCORE_BASE,
        text: this.i18n.get(entity.Description),
        itemId: entity.PerkID,
      })
    )
    this.head.updateMetadata({
      title: [this.i18n.get(entity.DisplayName), entity.PerkType].join(' - '),
      description: description,
      url: this.head.currentUrl,
      image: entity.IconPath,
    })
  }
}
