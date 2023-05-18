import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges } from '@angular/core'
import { NwModule } from '~/nw'
import { LootBucketNode, LootBucketRowNode, LootNode, LootTableItemNode, LootTableNode } from '~/nw/loot/loot-graph'
import { LootTable } from '~/nw/utils'
import { IconsModule } from '~/ui/icons'
import { svgAngleLeft, svgCircleExclamation, svgLink, svgLock, svgLockOpen } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { ItemDetailModule } from '../data/item-detail'
import { PaginationModule } from '~/ui/pagination'
import { RouterModule } from '@angular/router'

@Component({
  standalone: true,
  selector: 'nwb-loot-graph-node',
  templateUrl: './loot-graph-node.component.html',
  styleUrls: ['./loot-graph-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, IconsModule, ItemDetailModule, TooltipModule, RouterModule, PaginationModule],
  host: {
    class: 'contents',
  },
})
export class LootGraphNodeComponent implements OnChanges {
  @Input()
  public node: LootNode

  @Input()
  public showLocked: boolean

  @Input()
  public showChance: boolean

  @Input()
  public expand: boolean

  @Input()
  public showLink: boolean

  protected displayName: string
  protected typeName: string
  protected itemIds: string[]
  protected table: LootTable
  protected children: LootNode[]
  protected itemId: string
  protected itemQuantity: string
  protected rollThreshold: string
  protected tagValue: string
  protected unlocked: boolean
  protected unlockedItemCount: number
  protected totalItemCount: number
  protected highlight: boolean

  protected chanceRel: number
  protected chanceAbs: number

  protected itemTags: string[]
  protected childGrid = false

  protected iconExpand = svgAngleLeft

  protected expandable: boolean

  protected lootNode: LootNode
  protected trackByIndex = (i: number) => i

  protected iconinfo = svgCircleExclamation
  protected iconLock = svgLock
  protected iconLockOpen = svgLockOpen
  protected link: any[] = null
  protected linkIcon = svgLink
  public constructor(private cdRef: ChangeDetectorRef) {
    //
  }

  public ngOnChanges(): void {
    this.updateFromNode(this.node)
    this.cdRef.markForCheck()
  }

  protected toggle() {
    this.expand = !this.expand
  }

  private updateFromNode(node: LootNode) {
    this.link = null
    this.unlocked = node?.unlocked
    this.unlockedItemCount = node?.unlockedItemcount
    this.totalItemCount = node?.totalItemCount
    this.chanceAbs = node?.chanceAbsolute
    this.chanceRel = node?.chanceRelative
    this.highlight = node?.highlight
    if (this.expand == null) {
      this.expand = this.highlight
    }
    this.lootNode = node
    this.typeName = null
    this.displayName = null
    this.table = null
    this.itemId = null
    this.itemQuantity = null
    this.itemTags = null
    this.expandable = false
    this.childGrid = false
    this.children = node?.children
    if (!this.showLocked) {
      this.children = this.children?.filter((it) => !!it.unlocked && !!it.unlockedItemcount)
    }

    if (!node) {
      return
    }
    this.updateFromTableRow(node)
    if (node.type === 'table') {
      this.updateFromTableNode(node)
    }
    if (node.type === 'table-item') {
      this.updateFromTableItemNode(node)
    }
    if (node.type === 'bucket') {
      this.updateFromBucketNode(node)
    }
    if (node.type === 'bucket-row') {
      this.updateFromBucketRowNode(node)
    }
  }

  private updateFromTableNode(node: LootTableNode) {
    this.link = this.showLink ? ['/loot', node.data.LootTableID] : null
    this.table = node.data
    this.expandable = true
    this.typeName = 'table'
    this.displayName = node.ref
  }
  private updateFromTableRow(node: LootNode) {
    const row = node.row
    if (!row) {
      return
    }
    const table = (node.parent as LootTableNode).data
    this.itemQuantity = row.Qty
    this.rollThreshold = table.MaxRoll > 0 ? row.Prob : null
    this.tagValue = !table.MaxRoll && row.Prob != '0' ? row.Prob : null
  }
  private updateFromTableItemNode(node: LootTableItemNode) {
    if (node.row.ItemID) {
      this.itemId = node.row.ItemID
    }
  }
  private updateFromBucketNode(node: LootBucketNode) {
    this.expandable = true
    this.childGrid = true
    this.typeName = `bucket`
    this.displayName = node.ref
  }
  private updateFromBucketRowNode(node: LootBucketRowNode) {
    this.itemId = node.data.Item
    this.itemQuantity = node.data.Quantity.join('-')
    this.itemTags = Array.from(node.data.Tags.values()).map((it) => {
      if (it.Value != null) {
        return [it.Name, it.Value.join('-')].join(' ')
      }
      return it.Name
    })
  }

}
