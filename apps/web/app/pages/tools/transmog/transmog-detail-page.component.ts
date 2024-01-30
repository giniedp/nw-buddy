import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import {
  Itemappearancedefinitions,
  ItemdefinitionsInstrumentsappearances,
  ItemdefinitionsWeaponappearances,
} from '@nw-data/generated'
import { TranslateService } from '~/i18n'
import { LayoutModule } from '~/ui/layout'
import { HtmlHeadService, observeRouteParam } from '~/utils'
import { AppearanceDetailModule } from '~/widgets/data/appearance-detail'

@Component({
  standalone: true,
  selector: 'nwb-transmog-detail-page',
  templateUrl: './transmog-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, AppearanceDetailModule, LayoutModule],
  host: {
    class: 'block',
  },
})
export class TransmogDetailPageComponent {
  protected appearanceId$ = observeRouteParam(inject(ActivatedRoute), 'id')

  public constructor(private head: HtmlHeadService, private i18n: TranslateService) {
    //
  }

  protected onEntity(
    entity: Itemappearancedefinitions | ItemdefinitionsInstrumentsappearances | ItemdefinitionsWeaponappearances
  ) {
    if (!entity) {
      return
    }
    this.head.updateMetadata({
      title: this.i18n.get(entity.Name),
      description: this.i18n.get(entity.Description),
      url: this.head.currentUrl,
      image: `${this.head.origin}/${entity.IconPath}`,
    })
  }
}
