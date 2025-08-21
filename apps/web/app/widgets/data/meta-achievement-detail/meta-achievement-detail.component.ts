import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, effect, inject, input, untracked } from '@angular/core'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridModule } from '~/ui/property-grid'
import { MetaAchievementDetailStore } from './meta-achievement-detail.store'

@Component({
  selector: 'nwb-meta-achievement-detail',
  templateUrl: './meta-achievement-detail.component.html',
  exportAs: 'mountDetail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, PropertyGridModule],
  providers: [MetaAchievementDetailStore],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class MetaAchievementDetailComponent {
  public achievementId = input<string>()
  public disableProperties = input<boolean>(false)

  public readonly store = inject(MetaAchievementDetailStore)
  public constructor() {
    effect(() => {
      const id = this.achievementId()
      untracked(() => this.store.load(id))
    })
  }

  public readonly achievement = this.store.record
  public readonly title = this.store.title
  public readonly description = this.store.description
  public readonly displayCategory = this.store.displayCategory
  public readonly tierLabel = this.store.tierLabel

  public readonly icon = this.store.icon
  public readonly properties = this.store.properties
}
