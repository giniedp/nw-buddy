import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, TrackByFunction } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { firstValueFrom } from 'rxjs'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { ItemDetailStore } from './item-detail.store'
import { toSignal } from '@angular/core/rxjs-interop'
import { IconsModule } from '~/ui/icons'
import { svgEllipsisVertical } from '~/ui/icons/svg'

@Component({
  standalone: true,
  selector: 'nwb-item-detail-stats',
  exportAs: 'itemDetailStats',
  templateUrl: 'item-detail-stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, OverlayModule, ItemFrameModule, IconsModule],
  host: {
    class: 'block nw-item-section relative',
  },
})
export class ItemDetailStatsComponent {
  protected vm$ = this.store.vmStats$
  protected trackByIndex: TrackByFunction<any> = (i) => i
  protected editable$ = toSignal(this.store.gsEditable$)
  protected editIcon = svgEllipsisVertical

  public constructor(protected store: ItemDetailStore) {
    //
  }

  protected onGearScoreEdit(e: MouseEvent) {
    if (this.editable$()) {
      this.store.gsEdit$.emit(e)
    }
  }
}
