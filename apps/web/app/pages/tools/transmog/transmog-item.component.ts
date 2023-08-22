import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { observeRouteParam } from '~/utils'
import { TransmogItem, TransmogService, getAppearanceId } from './transmog.service'
import { LayoutModule } from '~/ui/layout'
import { ItemFrameModule } from '~/ui/item-frame'
import { IconsModule } from '~/ui/icons'
import { Observable, combineLatest, map } from 'rxjs'
import { getItemId } from '@nw-data/common'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { svgBrush } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'

@Component({
  standalone: true,
  selector: 'nwb-transmog-item',
  templateUrl: './transmog-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    LayoutModule,
    ItemFrameModule,
    IconsModule,
    RouterModule,
    ItemDetailModule,
    TooltipModule,
  ],
  host: {
    class: 'flex-none flex flex-col',
  },
})
export class TransmogItemComponent {
  private service = inject(TransmogService)
  private appearanceId = observeRouteParam(inject(ActivatedRoute), 'id')
  protected appearance$: Observable<TransmogItem> = this.service.byAppearanceId(this.appearanceId)
  protected similar$: Observable<TransmogItem[]> = combineLatest({
    appearance: this.appearance$,
    similar: this.service.byModel(this.appearance$),
  }).pipe(
    map(({ appearance, similar }) => {
      return similar.filter((item) => getAppearanceId(item.appearance) !== getAppearanceId(appearance.appearance))
    })
  )
  protected iconDye = svgBrush
  public constructor() {
    //
  }
}
