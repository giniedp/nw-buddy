import { ChangeDetectionStrategy, Component, computed, HostBinding, inject } from '@angular/core'
import { getItemAttribution, getItemExpansion } from '@nw-data/common'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { ItemDetailStore } from './item-detail.store'

@Component({
  selector: 'nwb-item-detail-attribution',
  template: `
    @if (!isHidden()) {
      <div animate.enter="fade-grow-y-in" animate.leave="fade-grow-y-out">
        <div class="p-2">
          @if (attribution(); as it) {
            <div class="flex flex-row items-center gap-1">
              <img [nwImage]="it.icon" class="w-6 h-6" />
              <span>{{ it.label | nwText }}</span>
            </div>
          }
          @if (expansion(); as it) {
            <div class="flex flex-row items-center gap-1">
              <img [nwImage]="it.icon" class="w-6 h-6" />
              <span>{{ it.label | nwText }}</span>
            </div>
          }
        </div>
        <div class="nw-item-divider"></div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NwModule, IconsModule],
  host: {
    class: 'block',
  },
})
export class ItemDetailAttributionComponent {
  protected store = inject(ItemDetailStore)
  protected attribution = computed(() => getItemAttribution(this.store.record()))
  protected expansion = computed(() => getItemExpansion(this.store.item()?.RequiredExpansionId))
  public isHidden = computed(() => !this.attribution() && !this.expansion())
}
