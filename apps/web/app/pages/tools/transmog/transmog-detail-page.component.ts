import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute } from '@angular/router'
import { ArmorAppearanceDefinitions, WeaponAppearanceDefinitions } from '@nw-data/generated'
import { TranslateService } from '~/i18n'
import { LayoutModule } from '~/ui/layout'
import { HtmlHeadService, observeRouteParam } from '~/utils'
import { AppearanceDetailModule } from '~/widgets/data/appearance-detail'

@Component({
  selector: 'nwb-transmog-detail-page',
  template: ` <nwb-appearance-detail [appearance]="appearanceId()" (appearanceChange)="onEntity($event)" /> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, AppearanceDetailModule, LayoutModule],
  host: {
    class: 'block',
  },
})
export class TransmogDetailPageComponent {
  protected appearanceId = toSignal(observeRouteParam(inject(ActivatedRoute), 'id'))

  public constructor(
    private head: HtmlHeadService,
    private i18n: TranslateService,
  ) {
    //
  }

  protected onEntity(entity: ArmorAppearanceDefinitions | WeaponAppearanceDefinitions) {
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
