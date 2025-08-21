import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridModule } from '~/ui/property-grid'
import { PlayerTitleDetailStore } from './player-title-detail.store'

@Component({
  selector: 'nwb-player-title-detail',
  templateUrl: './player-title-detail.component.html',
  exportAs: 'mountDetail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, PropertyGridModule],
  providers: [PlayerTitleDetailStore],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class PlayerTitleDetailComponent {
  public readonly store = inject(PlayerTitleDetailStore)
  public titleId = input<string>(null)

  public constructor() {
    this.store.load(this.titleId)
  }
}
