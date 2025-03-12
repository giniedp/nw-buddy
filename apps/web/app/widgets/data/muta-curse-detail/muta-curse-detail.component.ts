import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, effect, inject, input, untracked } from '@angular/core'
import { StatusEffectData } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridModule } from '~/ui/property-grid'
import { ModelViewerModule } from '~/widgets/model-viewer'
import { MutaCurseDetailStore } from './muta-curse-detail.store'

@Component({
  selector: 'nwb-muta-curse-detail',
  templateUrl: './muta-curse-detail.component.html',
  exportAs: 'curseDetail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, PropertyGridModule, ModelViewerModule],
  providers: [MutaCurseDetailStore],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class MutaCurseDetailComponent {
  public store = inject(MutaCurseDetailStore)
  public curseId = input<string>()
  public wildcard = input<string>()

  #loader = effect(() => {
    const curseId = this.curseId()
    const wildcard = this.wildcard()
    untracked(() => this.store.load({ curseId, wildcard }))
  })

  protected description(item: StatusEffectData) {
    return item.Description || `${item.StatusID}_Tooltip`
  }
}
