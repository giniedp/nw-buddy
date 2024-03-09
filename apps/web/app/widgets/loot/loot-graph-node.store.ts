import { computed, inject } from '@angular/core'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { LootNode, LootTableNode } from '~/nw/loot/loot-graph'
import { LootGraphGridCellComponent } from './loot-graph-grid-cell.component'
import { LootGraphStore } from './loot-graph.store'
import { includesConditionTag } from './utils'
import { LootGraphService } from './loot-graph.service'
import { isLootTagKnownCondition } from '@nw-data/common'

export interface LootGraphNodeState<T = LootNode> {
  node: T
  expand: boolean
  showLink: boolean
}
export const LootGraphNodeStore = signalStore(
  withState<LootGraphNodeState>({
    node: null,
    expand: false,
    showLink: false,
  }),
  withComputed((state, graph = inject(LootGraphStore)) => {
    return {
      showChance: graph.showChance,
      showLocked: graph.showLocked,
      tagsEditable: graph.tagsEditable,
    }
  }),
  withMethods((state) => {
    return {
      toggleExpand: () => patchState(state, { expand: !state.expand() }),
    }
  }),
  withComputed(({ node, showLink, showLocked }, service = inject(LootGraphService)) => {
    return {
      expandable: computed(() => selectExpandable(node())),
      children: computed(() => selectChildren(node()?.children, showLocked())),
      link: computed(() => (showLink() ? selectLink(node()) : null)),
      typeName: computed(() => node()?.type),
      displayName: computed(() => node()?.ref),
      highlight: computed(() => node()?.highlight),
      unlocked: computed(() => node()?.unlocked),
      unlockedItemCount: computed(() => node()?.unlockedItemcount),
      totalItemCount: computed(() => node()?.totalItemCount),
      chanceAbs: computed(() => node()?.chanceAbsolute),
      chanceRel: computed(() => node()?.chanceRelative),
      table: computed(() => selectTable(node())),
      itemId: computed(() => selectItemId(node())),
      itemQuantity: computed(() => selectItemQuantity(node())),
      rollThreshold: computed(() => selectRollThreshold(node())),
      condition: computed(() => selectCondition(node(), service)),
      conditions: computed(() => selectConditions(node(), service)),
      tags: computed(() => selectTags(node(), service)),

    }
  }),
)

function selectExpandable(node: LootNode) {
  return !!node && (node.type === 'table' || node.type === 'bucket')
}

function selectLink(node: LootNode) {
  if (node?.type === 'table') {
    return ['/loot/table', (node as LootTableNode).data.LootTableID]
  }
  return null
}

function selectChildren(children: LootNode[], showLocked: boolean) {
  if (!showLocked) {
    children = children?.filter((it) => !!it.unlocked && !!it.unlockedItemcount)
  }
  if (!children.length) {
    return null
  }
  return {
    items: children,
    count: children.length,
    gridOptions: LootGraphGridCellComponent.buildGridOptions(),
    isOnlyItems: children.every((it) => it.type === 'table-item' || it.type === 'bucket-row'),
  }
}

function selectTable(node: LootNode) {
  if (node?.type === 'table') {
    return node.data
  }
  return null
}

function selectItemId(node: LootNode) {
  if (!node) {
    return null
  }
  if (node.type === 'table-item') {
    return node.row.ItemID
  }
  if (node.type === 'bucket-row') {
    return node.data.Item
  }
  return null
}

function selectItemQuantity(node: LootNode) {
  if (node?.type === 'bucket-row') {
    return node.data.Quantity.join('-')
  }
  return node.row?.Qty
}

function selectRollThreshold(node: LootNode) {
  if (!node?.row) {
    return null
  }
  const row = node.row
  const parent = node.parent
  if (parent.type === 'table') {
    const table = parent.data
    return table.MaxRoll > 0 ? row.Prob : null
  }
  return null
}

function selectCondition(node: LootNode, service: LootGraphService) {
  if (!node?.row) {
    return null
  }
  const row = node.row
  const parent = node.parent
  if (parent.type !== 'table') {
    return null
  }
  const table = parent.data
  if (table.MaxRoll) {
    return null
  }
  const condition = table.Conditions.find(isLootTagKnownCondition)
  if (!condition) {
    return null
  }
  return {
    tag: condition,
    value: row.Prob,
    checked: service.isTagInContext(condition, row.Prob),
  }
}

function selectConditions(node: LootNode, service: LootGraphService) {
  if (node?.type !== 'table') {
    return null
  }
  return node.data.Conditions?.map((tag) => {
    if (isLootTagKnownCondition(tag)) {
      return {
        tag,
        checked: false,
        editable: false,
      }
    }
    return {
      tag,
      checked: service.isTagInContext(tag, null),
      editable: service.tagsEditable,
    }
  })
}

function selectTags(node: LootNode, service: LootGraphService) {
  if (node?.type !== 'bucket-row') {
    return null
  }
  return Array.from(node.data.Tags.values()).map((it) => {
    return {
      tag: it.name,
      value: it.value?.join('-'),
      checked: service.isTagInContext(it.name, it.value),
      editable: service.tagsEditable && !it.value
    } as const
  })
}
