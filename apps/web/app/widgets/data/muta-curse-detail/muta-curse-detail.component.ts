import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, forwardRef, Input } from '@angular/core'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridModule } from '~/ui/property-grid'
import { ModelViewerModule } from '~/widgets/model-viewer'
import { MutaCurseDetailStore } from './muta-curse-detail.store'
import { StatusEffectData } from '@nw-data/generated'

@Component({
  standalone: true,
  selector: 'nwb-muta-curse-detail',
  templateUrl: './muta-curse-detail.component.html',
  exportAs: 'curseDetail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, PropertyGridModule, ModelViewerModule],
  providers: [
    {
      provide: MutaCurseDetailStore,
      useExisting: forwardRef(() => MutaCurseDetailComponent),
    },
  ],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class MutaCurseDetailComponent extends MutaCurseDetailStore {
  @Input()
  public set curseId(value: string) {
    this.patchState({ curseId: value })
  }

  @Input()
  public set wildcard(value: string) {
    this.patchState({ wildcard: value })
  }

  protected description(item: StatusEffectData) {
    return item.Description || `${item.StatusID}_Tooltip`
  }
}
