import { computed, inject } from '@angular/core'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { isLootTagKnownCondition } from '@nw-data/common'
import { NwLinkService } from '~/nw'
import { LootBucketRowNode, LootNode, LootTableNode } from '~/nw/loot/loot-graph'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { LootGraphService } from './loot-graph.service'
import { LootGraphStore } from './loot-graph.store'

export interface LootGraphNodeState<T = LootNode> {
  node: T
  expand: boolean
  showLink: boolean
  showHighlightOnly: boolean
  gridOptions: VirtualGridOptions<LootBucketRowNode>
}
export const LootGraphNodeStore = signalStore(
  { protectedState: false },
  withState<LootGraphNodeState>({
    node: null,
    expand: false,
    showLink: false,
    showHighlightOnly: false,
    gridOptions: null,
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
      useGridOptions: (options: VirtualGridOptions<LootBucketRowNode>) => patchState(state, { gridOptions: options }),
    }
  }),
  withComputed(({ node, showLink, showLocked, gridOptions, showHighlightOnly }) => {
    const service = inject(LootGraphService)
    const linkService = inject(NwLinkService)
    return {
      expandable: computed(() => selectExpandable(node())),
      children: computed(() => {
        return selectChildren({
          children: node()?.children,
          showLocked: showLocked(),
          gridOptions: gridOptions(),
          showHighlightOnly: showHighlightOnly(),
        })
      }),
      link: computed(() => (showLink() ? selectLink(node(), linkService) : null)),
      typeName: computed(() => node()?.type),
      displayName: computed(() => node()?.ref),
      isHighlighted: computed(() => node()?.isHighlighted),
      isUnlocked: computed(() => node()?.isUnlocked),
      itemCountTotal: computed(() => node()?.itemCountTotal),
      itemCountUnlocked: computed(() => node()?.itemCountUnlocked),
      itemCountLocked: computed(() => node()?.itemCountTotal - node()?.itemCountUnlocked),
      chance: computed(() => node()?.chance),
      chanceCumulative: computed(() => node()?.chanceCumulative),
      luckNeeded: computed(() => node()?.luckNeeded),
      table: computed(() => selectTable(node())),
      tableProps: computed(() => selectTableProps(node())),
      itemId: computed(() => selectItemId(node())),
      itemQuantity: computed(() => selectBucketItemQuantity(node())),
      rollThreshold: computed(() => selectRollThreshold(node())),
      condition: computed(() => selectCondition(node(), service)),
      conditions: computed(() => selectConditions(node(), service)),
      matchOne: computed(() => selectBucketMatchOne(node())),
      odds: computed(() => selectBucketOdds(node())),
      tags: computed(() => selectTags(node(), service)),
    }
  }),
)

function selectExpandable(node: LootNode) {
  return !!node && (node.type === 'table' || node.type === 'bucket')
}

function selectLink(node: LootNode, service: NwLinkService) {
  if (node?.type === 'table') {
    return service.resourceLink({ type: 'loot', id: (node as LootTableNode).data.LootTableID.toLowerCase() })
  }
  return null
}

function selectChildren({
  children,
  showLocked,
  gridOptions,
  showHighlightOnly,
}: {
  children: LootNode[]
  showLocked: boolean
  gridOptions: VirtualGridOptions<LootBucketRowNode>
  showHighlightOnly: boolean
}) {
  if (showHighlightOnly) {
    children = children?.filter((it) => it.isHighlighted)
  } else if (!showLocked) {
    children = children?.filter((it) => !!it.isUnlocked && !!it.itemCountUnlocked)
  }
  if (!children.length) {
    return null
  }
  return {
    items: children,
    count: children.length,
    gridOptions: gridOptions,
    isOnlyItems: children.every((it) => it.type === 'bucket-row'),
  }
}

function selectTable(node: LootNode) {
  if (node?.type === 'table') {
    return node.data
  }
  return null
}

function selectTableProps(node: LootNode) {
  let result = selectTable(node)
  if (!result) {
    return null
  }
  result = {
    ...result,
  }
  delete result.Items
  return result
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

function selectBucketItemQuantity(node: LootNode) {
  if (node?.type === 'bucket-row') {
    return node.data.Quantity.join('-')
  }
  return node.row?.Qty
}

function selectBucketMatchOne(node: LootNode) {
  if (node?.type === 'bucket-row') {
    return node.data.MatchOne
  }
  return false
}

function selectBucketOdds(node: LootNode) {
  if (node?.type === 'bucket-row') {
    return node.data.Odds
  }
  return null
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
  const condition = table.Conditions?.find(isLootTagKnownCondition)
  if (!condition) {
    return null
  }
  return {
    tag: condition,
    label: `≥ ${row.Prob}`,
    value: row.Prob,
    checked: service.isTagInContext(condition, row.Prob),
    tooltip: `The ${condition} must be ≥ ${row.Prob}`,
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

  return Array.from(node.data?.Tags?.values() || []).map((it) => {
    return {
      tag: it.name,
      value: it.value?.join('-'),
      checked: service.isTagInContext(it.name, it.value),
      editable: service.tagsEditable && !it.value,
    } as const
  })
}
