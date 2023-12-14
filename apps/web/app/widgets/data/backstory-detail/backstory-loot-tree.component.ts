import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core'
import { BackstoryDetailStore } from './backstory-detail.store'
import { BackstoryLootNodeComponent } from './backstory-loot-node.component'
import { BackstoryLootTreeStore } from './backstory-loot-tree.store'
import { FormsModule } from '@angular/forms'

@Component({
  standalone: true,
  selector: 'nwb-backstory-loot-tree',
  templateUrl: './backstory-loot-tree.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [BackstoryLootTreeStore],
  imports: [BackstoryLootNodeComponent, FormsModule],
  host: {
    class: 'flex flex-col gap-2',
    '[class.hidden]': '!hasLoot()',
  },
})
export class BackstoryLootTreeComponent implements OnInit {
  protected detail = inject(BackstoryDetailStore)
  protected store = inject(BackstoryLootTreeStore)
  protected hasLoot = this.store.hasLoot
  protected nodes = this.store.nodesFiltered
  protected query = this.store.query

  public ngOnInit(): void {
    this.store.load(this.detail.backstory$)
  }

  protected updateQuery(value: string) {
    this.store.patchState({ query: value })
  }
}
