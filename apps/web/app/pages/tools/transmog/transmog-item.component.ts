import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { observeRouteParam } from '~/utils'
import { TransmogService } from './transmog.service'
import { LayoutModule } from '~/ui/layout'
import { ItemFrameModule } from '~/ui/item-frame'
import { IconsModule } from '~/ui/icons'
import { map } from 'rxjs'
import { getItemId } from '@nw-data/common'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { svgBrush } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'

@Component({
  standalone: true,
  selector: 'nwb-transmog-item',
  templateUrl: './transmog-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, LayoutModule, ItemFrameModule, IconsModule, RouterModule, ItemDetailModule, TooltipModule],
  host: {
    class: 'flex-none flex flex-col',
  },
})
export class TransmogItemComponent {
  private service = inject(TransmogService)
  private appearanceId = observeRouteParam(inject(ActivatedRoute), 'id')
  protected appearance$ = this.service.byAppearanceId(this.appearanceId)
  protected iconDye = svgBrush
  public constructor() {
    //
  }
}
