import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { NwModule } from '~/nw'
import { ItemDetailStore } from './item-detail.store'
import { toSignal } from '@angular/core/rxjs-interop'
import { IconsModule } from '~/ui/icons'

@Component({
  standalone: true,
  selector: 'nwb-item-detail-attribution',
  template: `
    <div *ngIf="attribution$(); let it" class="flex flex-row items-center gap-1">
      <img [nwImage]="it.icon" class="w-6 h-6" />
      <span>{{ it.label | nwText }}</span>
    </div>
    <div *ngIf="expansion$(); let it" class="flex flex-row items-center gap-1">
      <img [nwImage]="it.icon" class="w-6 h-6" />
      <span>{{ it.label | nwText }}</span>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, IconsModule],
  host: {
    class: 'block',
  },
})
export class ItemDetailAttributionComponent {
  protected attribution$ = toSignal(this.detail.attribution$, {
    initialValue: null,
  })
  protected expansion$ = toSignal(this.detail.expansion$, {
    initialValue: null,
  })

  public constructor(private detail: ItemDetailStore) {
    //
  }
}
