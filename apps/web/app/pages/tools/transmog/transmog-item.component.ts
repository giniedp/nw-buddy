import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { LayoutModule } from '~/ui/layout'
import { observeRouteParam } from '~/utils'
import { AppearanceDetailModule } from '~/widgets/data/appearance-detail'

@Component({
  standalone: true,
  selector: 'nwb-transmog-item',
  templateUrl: './transmog-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AppearanceDetailModule,
    LayoutModule
  ],
  host: {
    class: 'flex-none flex flex-col',
  },
})
export class TransmogItemComponent {
  protected appearanceId$ = observeRouteParam(inject(ActivatedRoute), 'id')

  public constructor() {
    //
  }
}
