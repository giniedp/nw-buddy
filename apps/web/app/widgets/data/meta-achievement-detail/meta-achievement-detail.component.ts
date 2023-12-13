import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, Input } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridModule } from '~/ui/property-grid'
import { ModelViewerModule } from '~/widgets/model-viewer'
import { MetaAchievementDetailStore } from './meta-achievement-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-meta-achievement-detail',
  templateUrl: './meta-achievement-detail.component.html',
  exportAs: 'mountDetail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, PropertyGridModule, ModelViewerModule],
  providers: [MetaAchievementDetailStore],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class MetaAchievementDetailComponent {
  public readonly store = inject(MetaAchievementDetailStore)

  @Input()
  public set achievementId(value: string) {
    this.store.patchState({ achievementId: value })
  }

  @Input()
  public disableProperties: boolean

  public readonly achievement = toSignal(this.store.achievement$)
  public readonly title = toSignal(this.store.title$)
  public readonly description = toSignal(this.store.description$)
  public readonly displayCategory = toSignal(this.store.displayCategory$)
  public readonly tierLabel = toSignal(this.store.tierLabel$)

  public readonly icon = toSignal(this.store.icon$)
  public readonly properties = toSignal(this.store.properties$)
}
