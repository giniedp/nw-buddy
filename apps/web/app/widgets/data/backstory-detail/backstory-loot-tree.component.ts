import { ChangeDetectionStrategy, Component, effect, inject, untracked } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { BackstoryDetailStore } from './backstory-detail.store'
import { BackstoryLootNodeComponent } from './backstory-loot-node.component'
import { BackstoryLootTreeStore } from './backstory-loot-tree.store'

@Component({
  selector: 'nwb-backstory-loot-tree',
  templateUrl: './backstory-loot-tree.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [BackstoryLootTreeStore],
  imports: [BackstoryLootNodeComponent, FormsModule],
  host: {
    class: 'flex flex-col',
    '[class.hidden]': '!hasLoot()',
  },
})
export class BackstoryLootTreeComponent {
  protected detail = inject(BackstoryDetailStore)
  protected store = inject(BackstoryLootTreeStore)
  protected hasLoot = this.store.hasLoot
  protected nodes = this.store.nodesFiltered
  protected query = this.store.query

  #fxLoad = effect(() => {
    const backstory = this.detail.backstory()
    untracked(() => this.store.load(backstory))
  })

  protected updateQuery(value: string) {
    this.store.patchState({ query: value })
  }
}
