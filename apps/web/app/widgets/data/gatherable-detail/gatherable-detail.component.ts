import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { GatherableDetailMapComponent } from './gatherable-detail-map.component'
import { GatherableDetailStore } from './gatherable-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-gatherable-detail',
  templateUrl: './gatherable-detail.component.html',
  exportAs: 'detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, GatherableDetailMapComponent],
  providers: [DecimalPipe, GatherableDetailStore],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class GatherableDetailComponent {
  protected store = inject(GatherableDetailStore)

  @Input()
  public set gatherableId(value: string) {
    this.store.patchState({ recordId: value })
  }

  public readonly recordId = toSignal(this.store.gatherableId$)
  public readonly icon = toSignal(this.store.icon$)
  public readonly name = toSignal(this.store.name$)
  public readonly size = toSignal(this.store.size$)
  public readonly tradeSkill = toSignal(this.store.tradeSkill$)
  public readonly lootTableId = toSignal(this.store.lootTableId$)
  public readonly props = toSignal(this.store.props$)
}
