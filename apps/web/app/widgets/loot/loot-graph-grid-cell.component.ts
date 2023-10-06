import { CommonModule } from '@angular/common'
import { Component, Input, inject } from '@angular/core'
import { NwModule } from '~/nw'
import { LootBucketRowNode, LootTableNode } from '~/nw/loot/loot-graph'
import { VirtualGridCellComponent, VirtualGridOptions } from '~/ui/data/virtual-grid'
import { ItemDetailModule, ItemDetailStore } from '../data/item-detail'
import { EmptyComponent } from '../empty'
import { ItemFrameModule } from '~/ui/item-frame'

@Component({
  standalone: true,
  selector: 'nwb-loot-graph-grid-cell',
  template: `
    <nwb-item-header
      [isNamed]="store.isNamed$ | async"
      [rarity]="store.rarity$ | async"
      [isColumn]="true"
      [isPadded]="false"
      class="h-full"
    >
      <div class="flex-1 flex flex-row gap-1 p-1">
        <a
          [nwLink]="store.entityId$ | async"
          [nwLinkResource]="'item'"
          [nwbItemIcon]="store.entity$ | async"
          class="w-14 h-14"
        >
        </a>
        <nwb-item-header-content
          [rarity]="store.rarity$ | async"
          [title]="store.name$ | async | nwText"
          [text1]="store.rarityName$ | async | nwText"
          [text2]="store.typeName$ | async | nwText"
          class="whitespace-nowrap"
        ></nwb-item-header-content>
      </div>
      <div class="flex-none flex flex-row gap-1 p-1 bg-black bg-opacity-40 w-full overflow-auto">
        <span *ngIf="rollThreshold" class="whitespace-nowrap badge badge-sm badge-primary">
          >= {{ rollThreshold }}
        </span>
        <span *ngIf="tagValue" class="whitespace-nowrap badge badge-sm badge-secondary"> >= {{ tagValue }} </span>
        <span class="badge badge-sm badge-primary whitespace-nowrap" *ngIf="itemQuantity">
          {{ itemQuantity }} &times;
        </span>
        <ng-container *ngIf="itemTags?.length">
          <span
            *ngFor="let tag of itemTags; trackBy: trackByIndex"
            class="badge badge-sm badge-secondary whitespace-nowrap"
          >
            {{ tag }}
          </span>
        </ng-container>
      </div>
    </nwb-item-header>
  `,
  imports: [CommonModule, NwModule, ItemFrameModule],
  providers: [ItemDetailStore],
  host: {
    class: 'block rounded-md overflow-clip m-1',
    '[class.outline]': 'selected',
    '[class.outline-primary]': 'selected',
    '[tabindex]': '0',
  },
})
export class LootGraphGridCellComponent extends VirtualGridCellComponent<LootBucketRowNode> {
  public static buildGridOptions(): VirtualGridOptions<LootBucketRowNode> {
    return {
      width: 320,
      height: 95,

      cellDataView: LootGraphGridCellComponent,
      cellEmptyView: EmptyComponent,
    }
  }

  @Input()
  public set data(node: LootBucketRowNode) {
    const row = node.row
    this.rollThreshold = null
    this.tagValue = null
    if (row) {
      const table = (node.parent as LootTableNode).data
      // vm.itemQuantity = row.Qty
      this.rollThreshold = table.MaxRoll > 0 ? row.Prob : null
      this.tagValue = !table.MaxRoll && row.Prob != '0' ? row.Prob : null
    }

    this.itemId = node.data.Item
    this.itemQuantity = node.data.Quantity.join('-')
    this.itemTags = Array.from(node.data.Tags.values()).map((it) => {
      if (it.Value != null) {
        return [it.Name, it.Value.join('-')].join(' ')
      }
      return it.Name
    })

    this.store.patchState({ entityId: this.itemId })
  }

  @Input()
  public selected: boolean

  protected itemId: string
  protected itemQuantity: string
  protected itemTags: string[]
  protected rollThreshold: string
  protected tagValue: string
  protected trackByIndex = (i: number) => i
  protected store = inject(ItemDetailStore)
}
