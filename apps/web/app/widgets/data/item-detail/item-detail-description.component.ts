import { ChangeDetectionStrategy, Component, computed, HostBinding, inject } from '@angular/core'
import { isItemHeartGem } from '@nw-data/common'
import { NwModule } from '~/nw'
import { IN_OUT_ANIM, IS_HIDDEN_ANIM } from './animation'
import { ItemDetailStore } from './item-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-item-detail-description',
  template: `
    @if (!isHidden()) {
      <div [@inOut] class="text-nw-description italic" [nwHtml]="description() | nwText:{ itemId: store.recordId() } | nwTextBreak"></div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NwModule],
  host: {
    class: 'block',
  },
  animations: [IS_HIDDEN_ANIM, IN_OUT_ANIM],
})
export class ItemDetailDescriptionComponent {
  protected store = inject(ItemDetailStore)
  protected isHidden = computed(() => !this.description() || isItemHeartGem(this.store.item()))
  protected description = computed(() => this.store.record()?.Description)

  @HostBinding('@isHidden')
  protected get isHiddenTrigger() {
    return this.isHidden()
  }
}
