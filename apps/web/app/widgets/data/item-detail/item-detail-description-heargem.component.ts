import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, HostBinding, inject } from '@angular/core'
import { isItemHeartGem } from '@nw-data/common'
import { NwModule } from '~/nw'
import { IN_OUT_ANIM, IS_HIDDEN_ANIM } from './animation'
import { ItemDetailStore } from './item-detail.store'

@Component({
  selector: 'nwb-item-detail-description-heargem',
  template: `
    @if (image()) {
      <div [@inOut]>
        <div class="-m-4">
          <img [nwImage]="image()" width="360" height="164" class="-mb-8 w-full" />
        </div>
      </div>
    }
    @if (title()) {
      <h3 class="text-xl font-bold" [@inOut]>{{ title() | nwText }}</h3>
    }
    @if (description()) {
      <div class="text-nw-description italic" [@inOut] [nwHtml]="description() | nwText | nwTextBreak"></div>
    }
  `,
  styles: [
    `
      img {
        mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, transparent 100%);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule],
  host: {
    class: 'block',
  },
  animations: [IS_HIDDEN_ANIM, IN_OUT_ANIM],
})
export class ItemDetailDescriptionHeargemComponent {
  protected store = inject(ItemDetailStore)
  protected isHidden = computed(() => !this.image() && !this.title() && !this.description())
  protected item = this.store.item
  protected image = computed(() => this.item()?.HeartgemTooltipBackgroundImage)
  protected title = computed(() => this.item()?.HeartgemRuneTooltipTitle)
  protected description = computed(() => {
    if (isItemHeartGem(this.item())) {
      return this.item()?.Description
    }
    return null
  })

  @HostBinding('@isHidden')
  protected get isHiddenTrigger() {
    return this.isHidden()
  }
}
