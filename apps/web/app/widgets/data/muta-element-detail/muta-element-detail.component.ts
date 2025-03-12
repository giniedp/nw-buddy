import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, effect, forwardRef, inject, input, Input, untracked } from '@angular/core'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridModule } from '~/ui/property-grid'
import { ModelViewerModule } from '~/widgets/model-viewer'
import { MutaElementDetailStore } from './muta-element-detail.store'
import { StatusEffectData } from '@nw-data/generated'

@Component({
  selector: 'nwb-muta-element-detail',
  templateUrl: './muta-element-detail.component.html',
  exportAs: 'elementDetail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, PropertyGridModule, ModelViewerModule],
  providers: [MutaElementDetailStore],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class MutaElementDetailComponent {
  public store = inject(MutaElementDetailStore)
  public elementId = input<string>()

  #loader = effect(() => {
    const elementId = this.elementId()
    untracked(() => this.store.load({ elementId }))
  })

  protected description(item: StatusEffectData) {
    return item.Description || `${item.StatusID}_Tooltip`
  }
}
