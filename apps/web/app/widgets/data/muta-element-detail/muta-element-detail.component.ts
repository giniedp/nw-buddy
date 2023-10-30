import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, forwardRef, Input } from '@angular/core'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridModule } from '~/ui/property-grid'
import { ModelViewerModule } from '~/widgets/model-viewer'
import { MutaElementDetailStore } from './muta-element-detail.store'
import { Statuseffect } from '@nw-data/generated'

@Component({
  standalone: true,
  selector: 'nwb-muta-element-detail',
  templateUrl: './muta-element-detail.component.html',
  exportAs: 'elementDetail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, PropertyGridModule, ModelViewerModule],
  providers: [
    {
      provide: MutaElementDetailStore,
      useExisting: forwardRef(() => MutaElementDetailComponent),
    },
  ],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class MutaElementDetailComponent extends MutaElementDetailStore {
  @Input()
  public set elementId(value: string) {
    this.patchState({ elementId: value })
  }

  protected description(item: Statuseffect) {
    return item.Description || `${item.StatusID}_Tooltip`
  }
}
