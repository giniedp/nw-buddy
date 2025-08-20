import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, effect, inject, Injector, Input, untracked } from '@angular/core'
import { RouterModule } from '@angular/router'
import { LootTable } from '@nw-data/common'
import { NwModule } from '~/nw'
import { LootNode } from '~/nw/loot/loot-graph'
import { IconsModule } from '~/ui/icons'
import {
  svgAngleLeft,
  svgBucket,
  svgCircleExclamation,
  svgClover,
  svgCode,
  svgEye,
  svgEyeSlash,
  svgFilter,
  svgLink,
  svgLock,
  svgLockOpen,
  svgTableList,
} from '~/ui/icons/svg'
import { PaginationModule } from '~/ui/pagination'
import { TooltipModule } from '~/ui/tooltip'

import { patchState } from '@ngrx/signals'
import { LootTablesData } from '@nw-data/generated'
import { isEqual } from 'date-fns/isEqual'
import { filter, map, take } from 'rxjs'
import { VirtualGridModule } from '~/ui/data/virtual-grid'
import { gridDescriptor, PropertyGridModule } from '~/ui/property-grid'
import { textCell, valueCell } from '~/ui/property-grid/cells'
import { eqCaseInsensitive } from '~/utils'
import { ItemDetailHeaderComponent } from '../data/item-detail/item-detail-header.component'
import { ItemDetailComponent } from '../data/item-detail/item-detail.component'
import { openItemsPicker } from '../data/item-table'
import { diffButtonCell, DiffButtonComponent } from '../diff-tool'
import { LootGraphGridCellComponent } from './loot-graph-grid-cell.component'
import { LootGraphNodeStore } from './loot-graph-node.store'
import { LootGraphService } from './loot-graph.service'
import { LootTagComponent } from './loot-tag.component'

export interface LootGraphNodeState<T = LootNode> {
  node: T
  showLocked: boolean
  showChance: boolean
  expand: boolean
  showLink: boolean
  tagsEditable: boolean
}

@Component({
  selector: 'nwb-loot-graph-node',
  templateUrl: './loot-graph-node.component.html',
  styleUrl: './loot-graph-node.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    IconsModule,
    ItemDetailComponent,
    ItemDetailHeaderComponent,
    TooltipModule,
    RouterModule,
    PaginationModule,
    VirtualGridModule,
    PropertyGridModule,
    LootTagComponent,
    DiffButtonComponent,
  ],
  providers: [LootGraphNodeStore],
  host: {
    class: 'contents',
  },
})
export class LootGraphNodeComponent {
  protected service = inject(LootGraphService)
  protected store = inject(LootGraphNodeStore)
  private injector = inject(Injector)

  @Input()
  public set node(value: LootNode) {
    patchState(this.store, { node: value })
  }

  @Input()
  public set expand(value: boolean) {
    patchState(this.store, { expand: value })
  }
  public get expand() {
    return this.store.expand() || this.forceExpand
  }

  @Input()
  public set showLink(value: boolean) {
    patchState(this.store, { showLink: value })
  }
  public get showLink() {
    return this.store.showLink()
  }

  @Input()
  public set showHighlightOnly(value: boolean) {
    patchState(this.store, { showHighlightOnly: value })
  }
  public get showHighlightOnly() {
    return this.store.showHighlightOnly()
  }

  protected get forceExpand() {
    return this.service.highlightPicker && !!this.service.highlight
  }

  public get tagsEditable() {
    return this.service.tagsEditable
  }
  public get showLocked() {
    return !this.tagsEditable || this.service.showLocked
  }
  public get showChance() {
    return this.service.showChance
  }
  public get showUnlockToggle() {
    return this.showLink && this.tagsEditable
  }
  public get showHighlightPicker() {
    return this.showLink && this.tagsEditable && this.service.highlightPicker
  }

  public get table() {
    return this.store.table()
  }
  public get link() {
    return this.store.link()
  }
  protected get typeName() {
    return this.store.typeName()
  }
  protected get displayName() {
    return this.store.displayName()
  }
  protected get expandable() {
    return this.store.expandable()
  }
  protected get children() {
    return this.store.children()
  }
  protected get highlight() {
    return this.store.isHighlighted()
  }
  protected get chanceRel() {
    return this.store.chance()
  }
  protected get chanceAbs() {
    return this.store.chanceCumulative()
  }
  protected get luckNeeded() {
    return this.store.luckNeeded()
  }
  protected get unlocked() {
    return this.store.isUnlocked()
  }
  protected get itemCountTotal() {
    return this.store.itemCountTotal()
  }
  protected get itemCountLocked() {
    return this.store.itemCountLocked()
  }
  protected get itemCountUnlocked() {
    return this.store.itemCountUnlocked()
  }
  protected get itemId() {
    return this.store.itemId()
  }
  protected get itemQuantity() {
    return this.store.itemQuantity()
  }
  protected get rollThreshold() {
    return this.store.rollThreshold()
  }
  protected get condition() {
    return this.store.condition()
  }
  protected get conditions() {
    return this.store.conditions()
  }
  protected get tags() {
    return this.store.tags()
  }
  protected get matchOne() {
    return this.store.matchOne()
  }
  protected get odds() {
    return this.store.odds()
  }

  protected iconExpand = svgAngleLeft
  protected iconInfo = svgCircleExclamation
  protected iconLock = svgLock
  protected iconLockOpen = svgLockOpen
  protected linkIcon = svgLink
  protected iconCode = svgCode
  protected iconBucket = svgBucket
  protected iconTable = svgTableList
  protected iconEye = svgEye
  protected iconEyeSlash = svgEyeSlash
  protected iconLuck = svgClover
  protected iconFilter = svgFilter
  public descriptor = gridDescriptor<LootTablesData>(
    {
      LootTableID: (value) => [
        textCell({ value: String(value) }),
        diffButtonCell({ record: this.store.table(), idKey: 'LootTableID' }),
      ],
    },
    (value) => valueCell({ value }),
  )

  public constructor() {
    this.store.useGridOptions(LootGraphGridCellComponent.buildGridOptions())
    effect(() => {
      const showHighlightOnly = !!this.service.highlight && this.service.highlightPicker
      untracked(() => {
        patchState(this.store, { showHighlightOnly })
      })
    })
  }

  protected toggle() {
    this.store.toggleExpand()
  }

  protected isTrue(value: boolean | number | string) {
    if (typeof value === 'string' && (eqCaseInsensitive(value, 'TRUE') || value === '1')) {
      return true
    }
    return !!value
  }

  protected getProps(value: LootTable) {
    const result = {
      ...value,
    }
    delete result.Items
    return result
  }

  protected toggleLockedClicked(e: Event) {
    e.preventDefault()
    e.stopImmediatePropagation()
    this.service.showLocked = !this.showLocked
  }

  protected highlightPickerClicked(e: Event) {
    e.preventDefault()
    e.stopImmediatePropagation()
    const selection = this.service.highlight
    openItemsPicker({
      injector: this.injector,
      multiple: false,
      selection: selection ? [selection] : [],
    })
      .pipe(
        take(1),
        // cancelled selection
        filter((result) => result !== undefined),
        map((result) => result[0]),
        // unchanged selection
        filter((result) => !isEqual(result, selection)),
      )
      .subscribe((result) => {
        this.service.highlight = result
      })
  }

  protected isConditionPassed(tag: string) {
    return this.service.isTagInContext(tag)
  }
}
