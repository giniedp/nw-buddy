import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Mounts } from '@nw-data/generated'
import { TranslateService } from '~/i18n'
import { LayoutModule } from '~/ui/layout'
import { HtmlHeadService, observeRouteParam } from '~/utils'
import { MountDetailModule } from '~/widgets/data/mount-detail'

@Component({
  standalone: true,
  selector: 'nwb-mount-item',
  templateUrl: './mount-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MountDetailModule, LayoutModule],
  host: {
    class: 'block',
  },
})
export class MountItemComponent {
  protected mountId$ = observeRouteParam(inject(ActivatedRoute), 'id')

  public constructor(private head: HtmlHeadService, private i18n: TranslateService) {
    //
  }

  protected onEntity(entity: Mounts) {
    if (!entity) {
      return
    }
    this.head.updateMetadata({
      title: this.i18n.get(entity.DisplayName),
      description: this.i18n.get(entity.Description),
      url: this.head.currentUrl,
      image: `${this.head.origin}/${entity.IconPath}`,
    })
  }
}
