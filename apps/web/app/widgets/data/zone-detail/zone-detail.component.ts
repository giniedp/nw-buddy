import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { ZoneDetailStore } from './zone-detail.store'
import { selectSignal } from '~/utils'
import { ZoneDetailMapComponent } from './zone-detail-map.component'

@Component({
  standalone: true,
  selector: 'nwb-zone-detail',
  templateUrl: './zone-detail.component.html',
  exportAs: 'detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, ZoneDetailMapComponent],
  providers: [DecimalPipe, ZoneDetailStore],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class ZoneDetailComponent {
  protected store = inject(ZoneDetailStore)

  @Input()
  public set zoneId(value: string | number) {
    this.store.patchState({ recordId: value })
  }

  public readonly recordId = selectSignal(this.store.recordId$, (it) => String(it))
  public readonly icon = toSignal(this.store.icon$)
  public readonly name = toSignal(this.store.name$)
  public readonly description = toSignal(this.store.description$)
  public readonly type = toSignal(this.store.type$)

}
