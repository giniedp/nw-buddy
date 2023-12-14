import { Injectable, inject } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { LootTable, getBackstoryItems, isItemOfAnyClass, isMasterItem } from '@nw-data/common'
import { Backstorydata, Housingitems, ItemDefinitionMaster } from '@nw-data/generated'
import { combineLatest, debounceTime, map, startWith } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService } from '~/nw'
import { selectStream } from '~/utils'
import { BackstoryTreeNode } from './types'
import { toSignal } from '@angular/core/rxjs-interop'

export interface BackstoryLootTreeState {
  nodes: BackstoryTreeNode[]
  hasLoot: boolean
  query: string
}

@Injectable()
export class BackstoryLootTreeStore extends ComponentStore<BackstoryLootTreeState> {
  protected db = inject(NwDbService)
  protected tl8 = inject(TranslateService)
  public readonly query$ = this.select(({ query }) => query)
  public readonly nodes$ = this.select(({ nodes }) => nodes)
  public readonly nodesFiltered$ = selectStream(
    {
      nodes: this.nodes$,
      query: this.query$.pipe(debounceTime(500), startWith('')),
    },
    ({ nodes, query }) => {
      return selectFilteredNodes(nodes, query, this.tl8)
    },
  )

  public readonly hasLoot = this.selectSignal(({ hasLoot }) => hasLoot)
  public readonly nodes = this.selectSignal(({ nodes }) => nodes)
  public readonly query = this.selectSignal(({ query }) => query)
  public readonly nodesFiltered = toSignal(this.nodesFiltered$)

  public constructor() {
    super({
      nodes: null,
      hasLoot: false,
      query: '',
    })
    this.db.lootTablesMap
  }

  public updateTree(modify: (step: BackstoryTreeNode) => BackstoryTreeNode) {
    this.patchState({
      nodes: this.nodes()?.map((node) => modifyTree(node, modify)),
    })
  }

  public updateNode(node: BackstoryTreeNode, modify: (node: BackstoryTreeNode) => BackstoryTreeNode) {
    this.updateTree((current) => {
      if (current === node) {
        return modify(current)
      }
      return current
    })
  }

  public toggleNode(node: BackstoryTreeNode) {
    this.updateNode(node, (it) => ({ ...it, expand: !it.expand }))
  }

  public readonly load = this.effect<Backstorydata>((bs$) => {
    return combineLatest({
      data: bs$,
      itemsMap: this.db.itemsMap,
      housingMap: this.db.housingItemsMap,
      lootTableMap: this.db.lootTablesMap,
      query: this.query$.pipe(debounceTime(500)),
    }).pipe(
      map((options) => {
        const state = selectState(options)
        this.patchState({
          hasLoot: state.hasLoot,
          nodes: state.nodes,
        })
      }),
    )
  })
}

function modifyTree(node: BackstoryTreeNode, modify: (step: BackstoryTreeNode) => BackstoryTreeNode) {
  if (!node) {
    return null
  }

  node = modify(node)
  if (node.children?.length) {
    Object.assign(node, { children: node.children.map((it) => modifyTree(it, modify)).filter((it) => !!it) })
  }
  return {
    ...node,
  }
}

function selectState({
  data,
  itemsMap,
  housingMap,
  lootTableMap,
}: {
  data: Backstorydata
  itemsMap: Map<string, ItemDefinitionMaster>
  housingMap: Map<string, Housingitems>
  lootTableMap: Map<string, LootTable>
}) {
  const lootItems = getBackstoryItems(data)
    .map((it) => itemsMap.get(it.itemId))
    .filter((it) => !!it && isItemOfAnyClass(it, ['LootContainer']))
  const nodes = lootItems.map((it) => selectLootNode({ item: it, itemsMap, housingMap, lootTableMap }))
  return {
    hasLoot: lootItems.length > 0,
    nodes,
  }
}

function selectLootNode({
  item,
  itemsMap,
  housingMap,
  lootTableMap,
}: {
  item: ItemDefinitionMaster | Housingitems
  itemsMap: Map<string, ItemDefinitionMaster>
  housingMap: Map<string, Housingitems>
  lootTableMap: Map<string, LootTable>
}): BackstoryTreeNode {
  if (!item) {
    return null
  }
  const result: BackstoryTreeNode = {
    expand: false,
    match: false,
    children: null,
    data: item,
  }

  if (isMasterItem(item) && isItemOfAnyClass(item, ['LootContainer'])) {
    Object.assign(result, {
      children: selectLootChildren({
        containerItem: item,
        itemsMap,
        housingMap,
        lootTableMap,
      }),
    })
  }

  return result
}

function selectLootChildren({
  containerItem,
  lootTableMap,
  itemsMap,
  housingMap,
}: {
  containerItem: ItemDefinitionMaster
  itemsMap: Map<string, ItemDefinitionMaster>
  housingMap: Map<string, Housingitems>
  lootTableMap: Map<string, LootTable>
}): BackstoryTreeNode[] {
  const recipe = containerItem?.RepairRecipe
  if (!recipe || !recipe.startsWith('[LTID]')) {
    return null
  }
  const ltid = recipe.replace('[LTID]', '')
  const table = lootTableMap.get(ltid)
  if (!table?.Items?.length) {
    return null
  }
  const result: BackstoryTreeNode[] = []
  for (const row of table.Items) {
    if (!row.ItemID) {
      // TODO: check if buckets and tables should be included
      continue
    }
    const item = itemsMap.get(row.ItemID) || housingMap.get(row.ItemID)
    const child = selectLootNode({
      item: item,
      itemsMap,
      housingMap,
      lootTableMap,
    })
    if (child) {
      result.push(child)
    }
  }
  return result
}

function selectFilteredNodes(nodes: BackstoryTreeNode[], query: string, tl8: TranslateService) {
  if (!query) {
    return nodes
  }
  const result: BackstoryTreeNode[] = []
  for (const node of nodes) {
    if (!node.data) {
      continue
    }
    if (node.children) {
      const children = selectFilteredNodes(node.children, query, tl8)
      if (!children.length) {
        continue
      }
      result.push({
        ...node,
        expand: true,
        children,
      })
    } else if (tl8.get(node.data.Name).toLocaleLowerCase().includes(query)) {
      result.push(node)
    }
  }
  return result
}
