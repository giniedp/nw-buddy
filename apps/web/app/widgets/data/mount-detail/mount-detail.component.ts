import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, forwardRef, Input } from '@angular/core'
import { Perks } from '@nw-data/generated'
import { NwDbService, NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridCell, PropertyGridModule } from '~/ui/property-grid'
import { MountDetailStore } from './mount-detail.store'
import { ModelViewerModule } from '~/widgets/model-viewer'

@Component({
  standalone: true,
  selector: 'nwb-mount-detail',
  templateUrl: './mount-detail.component.html',
  exportAs: 'mountDetail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, PropertyGridModule, ModelViewerModule],
  providers: [
    {
      provide: MountDetailStore,
      useExisting: forwardRef(() => MountDetailComponent),
    },
  ],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class MountDetailComponent extends MountDetailStore {
  @Input()
  public set mountId(value: string) {
    this.patchState({ mountId: value })
  }

  @Input()
  public disableProperties: boolean

  protected modelViewerOpened: boolean
  public constructor(db: NwDbService) {
    super(db)
  }
}
