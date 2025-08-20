import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { isItemHeartGem } from '@nw-data/common'
import { NwModule } from '~/nw'
import { ItemDetailStore } from './item-detail.store'

@Component({
  selector: 'nwb-item-detail-description',
  template: `
    @if (!isHidden()) {
      <div
        animate.enter="fade-grow-y-in"
        animate.leave="fade-grow-y-out"
        class="text-nw-description italic"
        [nwHtml]="description() | nwText: { itemId: store.recordId() } | nwTextBreak"
      ></div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NwModule],
  host: {
    class: 'block',
    '[class.hidden]': 'isHidden()',
  },
})
export class ItemDetailDescriptionComponent {
  protected store = inject(ItemDetailStore)
  protected isHidden = computed(() => !this.description() || isItemHeartGem(this.store.item()))
  protected description = computed(() => this.store.record()?.Description)
}
