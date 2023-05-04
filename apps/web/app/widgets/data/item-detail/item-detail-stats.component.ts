import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, TrackByFunction } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { firstValueFrom } from 'rxjs'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { ItemDetailStore } from './item-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-item-detail-stats',
  exportAs: 'itemDetailStats',
  templateUrl: 'item-detail-stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, OverlayModule, ItemFrameModule],
  host: {
    class: 'block',
  },
})
export class ItemDetailStatsComponent {

  protected vm$ = this.detail.vmStats$
  protected trackByIndex: TrackByFunction<any> = (i) => i

  public constructor(protected detail: ItemDetailStore) {
    //
  }

  protected async onGearScoreEdit(e: MouseEvent) {
    const isEditable = await firstValueFrom(this.detail.gsEditable$)
    if (isEditable) {
      this.detail.gsEdit$.emit(e)
    }
  }
}
