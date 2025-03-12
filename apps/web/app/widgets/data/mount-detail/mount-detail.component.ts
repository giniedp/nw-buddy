import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridModule } from '~/ui/property-grid'
import { MountDetailStore } from './mount-detail.store'
import { ModelViewerModule } from '~/widgets/model-viewer'

@Component({
  selector: 'nwb-mount-detail',
  templateUrl: './mount-detail.component.html',
  exportAs: 'mountDetail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, PropertyGridModule, ModelViewerModule],
  providers: [MountDetailStore],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class MountDetailComponent {
  public store = inject(MountDetailStore)

  @Input()
  public set mountId(value: string) {
    this.store.load(value)
  }

  @Input()
  public disableProperties: boolean

  protected modelViewerOpened: boolean
}
