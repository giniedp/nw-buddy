import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { NwModule } from '~/nw'
import { DataViewService } from '~/ui/data/data-view'
import { VirtualGridModule } from '~/ui/data/virtual-grid'
import { ArtifactRecord } from './adapter'

@Component({
  selector: 'nwb-artifacts-tracking',
  templateUrl: './artifacts-tracking.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, VirtualGridModule],
  host: {
    class: 'ion-page',
  },
})
export class ArtifactsTrackingComponent {
  protected service = inject(DataViewService<ArtifactRecord>)
}
