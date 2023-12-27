import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { ItemDetailStore } from './item-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-item-detail-attribution',
  template: `
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
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NwModule, IconsModule],
  host: {
    class: 'block',
  },
})
export class ItemDetailAttributionComponent {
  protected store = inject(ItemDetailStore)
  protected attribution = toSignal(this.store.attribution$, {
    initialValue: null,
  })
  protected expansion = toSignal(this.store.expansion$, {
    initialValue: null,
  })
}
