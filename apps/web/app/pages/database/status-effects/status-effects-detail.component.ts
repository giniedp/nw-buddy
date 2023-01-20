import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { Statuseffect } from '@nw-data/types'
import { firstValueFrom } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwModule } from '~/nw'
import { NwExpressionService } from '~/nw/expression'
import { NW_MAX_CHARACTER_LEVEL, NW_MAX_GEAR_SCORE_BASE } from '~/nw/utils/constants'
import { LayoutModule } from '~/ui/layout'
import { PropertyGridModule } from '~/ui/property-grid'
import { HtmlHeadService, observeRouteParam } from '~/utils'
import { AbilityDetailModule } from '~/widgets/ability-detail'
import { StatusEffectDetailModule } from '~/widgets/status-effect-detail'

@Component({
  standalone: true,
  selector: 'nwb-status-effects-detail-page',
  templateUrl: './status-effects-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, RouterModule, StatusEffectDetailModule, AbilityDetailModule, PropertyGridModule, LayoutModule],
  host: {
    class: 'flex-none flex flex-col',
  },
})
export class AbilitiesDetailComponent {
  public itemId = observeRouteParam(this.route, 'id')

  public constructor(private route: ActivatedRoute, private i18n: TranslateService, private expr: NwExpressionService, private head: HtmlHeadService) {
    //
  }

  protected async onEntity(entity: Statuseffect) {
    if (!entity) {
      return
    }
    const description = await firstValueFrom(this.expr.solve({
      charLevel: NW_MAX_CHARACTER_LEVEL,
      gearScore: NW_MAX_GEAR_SCORE_BASE,
      text: this.i18n.get(entity.Description),
      itemId: entity.StatusID
    }))
    this.head.updateMetadata({
      title: [this.i18n.get(entity.DisplayName), 'Status Effect'].join(' - '),
      description: description,
      url: this.head.currentUrl,
      image: entity.PlaceholderIcon || entity['IconPath']
    })
  }
}
