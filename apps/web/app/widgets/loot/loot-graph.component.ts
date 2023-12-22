import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { combineLatest, of, switchMap } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { LootContext } from '~/nw/loot'
import { LootNode, buildLootGraph, updateLootGraph } from '~/nw/loot/loot-graph'
import { selectSignal, selectStream } from '~/utils'
import { LootContextEditorComponent } from './loot-context-editor.component'
import { LootGraphNodeComponent } from './loot-graph-node.component'

@Component({
  standalone: true,
  selector: 'nwb-loot-graph',
  template: `
    @for (node of graph(); track $index) {
      <nwb-loot-graph-node
        [node]="node"
        [showLocked]="showLocked"
        [expand]="expand"
        [showChance]="showChance"
        [showLink]="true"
      />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NwModule, LootGraphNodeComponent, LootContextEditorComponent],
  host: {
    class: 'block ayout-content',
  },
})
export class LootGraphComponent extends ComponentStore<{
  tableIds: string[]
  tags: string[]
  tagValues: Record<string, string | number>
  dropChance: number
  highlight: string
}> {
  @Input()
  public showLocked = false

  @Input()
  public showEditor = true

  @Input()
  public showChance = false

  @Input()
  public showStats = false

  @Input()
  public expand = true

  @Input()
  public set tableId(value: string | string[]) {
    if (Array.isArray(value)) {
      this.patchState({ tableIds: value })
    } else if (typeof value === 'string') {
      this.patchState({ tableIds: [value] })
    } else {
      this.patchState({ tableIds: [] })
    }
  }

  @Input()
  public set tags(value: string[]) {
    this.patchState({ tags: value })
  }

  @Input()
  public set tagValues(value: Record<string, string | number>) {
    this.patchState({ tagValues: value })
  }

  @Input()
  public set dropChance(value: number) {
    this.patchState({ dropChance: value })
  }

  @Input()
  public set highlight(value: string) {
    this.patchState({ highlight: value })
  }

  protected tableIds$ = this.select((s) => s.tableIds)
  protected tags$ = this.select((s) => s.tags)
  protected tagValues$ = this.select((s) => s.tagValues)
  protected dropChance$ = this.select((s) => s.dropChance)
  protected highlight$ = this.select((s) => s.highlight)
  protected fullGraph$ = this.select(this.tableIds$.pipe(switchMap((ids) => this.lootGraph(ids))), (it) => it)

  protected context$ = this.select(
    combineLatest({
      tags: this.tags$,
      values: this.tagValues$,
    }),
    (params) => LootContext.create(params),
    { debounce: true },
  )
  protected graph = selectSignal(
    {
      graph: this.fullGraph$,
      context: this.context$,
      dropChance: this.dropChance$,
      highlight: this.highlight$,
    },
    ({ graph, context, dropChance, highlight }) => {
      if (!graph) {
        return null
      }
      return graph.map((it) => {
        return updateLootGraph({
          graph: it,
          context: this.showLocked ? null : context,
          dropChance,
          highlight,
        })
      })
    },
   // { debounce: true },
  )

  // protected knownTags$ = this.select(this.graph$, (graph) => {
  //   return Array.from(extractLootTagsFromGraph(graph))
  // })
  protected trackByIndex = (i: number) => i

  public constructor(private db: NwDbService) {
    super({
      tableIds: null,
      tags: [],
      tagValues: {},
      dropChance: 1,
      highlight: null,
    })
  }

  private lootGraph(tableIds: string[]) {
    if (!tableIds || !tableIds.length) {
      return of<LootNode[]>([])
    }
    return combineLatest(tableIds.map((tableId) => this.lootGraphForTable(tableId)))
  }

  private lootGraphForTable(tableId: string) {
    return selectStream(
      {
        entry: this.db.lootTable(tableId),
        tables: this.db.lootTablesMap,
        buckets: this.db.lootBucketsMap,
      },
      (data) => buildLootGraph(data),
    )
  }
}
