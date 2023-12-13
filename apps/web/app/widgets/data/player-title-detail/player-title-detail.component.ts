import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridModule } from '~/ui/property-grid'
import { ModelViewerModule } from '~/widgets/model-viewer'
import { PlayerTitleDetailStore } from './player-title-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-player-title-detail',
  templateUrl: './player-title-detail.component.html',
  exportAs: 'mountDetail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, PropertyGridModule, ModelViewerModule],
  providers: [PlayerTitleDetailStore],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class PlayerTitleDetailComponent {
  public readonly store = inject(PlayerTitleDetailStore)

  @Input()
  public set titleId(value: string) {
    this.store.patchState({ titleId: value })
  }

  public readonly type = toSignal(this.store.type$)
  public readonly title = toSignal(this.store.title$)
  public readonly titleFemale = toSignal(this.store.titleFemale$)
  public readonly titleNeutral = toSignal(this.store.titleNeutral$)
  public readonly description = toSignal(this.store.description$)
  public readonly properties = toSignal(this.store.properties$)
}
