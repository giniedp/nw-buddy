import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { NwModule } from '~/nw'
import { DataViewService } from '~/ui/data/data-view'
import { VirtualGridModule } from '~/ui/data/virtual-grid'
import { MusicRecord } from './adapter'

@Component({
  selector: 'nwb-music-tracking',
  templateUrl: './music-tracking.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, VirtualGridModule],
  host: {
    class: 'ion-page',
  },
})
export class MusicTrackingComponent {
  public constructor(
    private route: ActivatedRoute,
    protected service: DataViewService<MusicRecord>,
  ) {
    //
  }
}
