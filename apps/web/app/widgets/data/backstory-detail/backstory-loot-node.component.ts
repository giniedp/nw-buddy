import { ChangeDetectionStrategy, Component, Input, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { getItemId, getItemRarity, isItemNamed, isMasterItem } from '@nw-data/common'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { ItemFrameModule } from '~/ui/item-frame'
import { TreeNodeToggleComponent } from '~/ui/tree'
import { BackstoryLootTreeStore } from './backstory-loot-tree.store'
import { BackstoryTreeNode } from './types'

@Component({
  selector: 'nwb-backstory-loot-node',
  templateUrl: './backstory-loot-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NwModule,
    ItemFrameModule,
    IconsModule,
    TreeNodeToggleComponent,
    FormsModule,
    RouterModule,
  ],
  host: {
    class: 'flex flex-col',
  },
})
export class BackstoryLootNodeComponent {
  protected store = inject(BackstoryLootTreeStore)

  @Input()
  public set node(value: BackstoryTreeNode) {
    this.record.set(value)
  }

  @Input()
  public hasParent = false

  @Input()
  public hasNext = true

  private record = signal<BackstoryTreeNode>(null)
  protected isOpen = computed(() => this.record()?.expand)
  protected data = computed(() => this.record()?.data)
  protected isNamed = computed(() => {
    const item = this.data()
    return !!item && isMasterItem(item) && isItemNamed(item)
  })
  protected rarity = computed(() => getItemRarity(this.data()))
  protected label = computed(() => this.data()?.Name)
  protected icon = computed(() => this.data()?.IconPath)
  protected itemId = computed(() => getItemId(this.data()))
  protected hasChildren = computed(() => this.record()?.children?.length > 0)
  protected children = computed(() => this.record()?.children || [])

  protected toggle() {
    if (this.hasChildren()) {
      this.store.toggleNode(this.record())
    }
  }
}
