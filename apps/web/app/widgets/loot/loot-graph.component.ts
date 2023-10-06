import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { combineLatest, map } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { LootContext } from '~/nw/loot'
import { buildLootGraph, extractLootTagsFromGraph, updateLootGraph } from '~/nw/loot/loot-graph'
import { LootGraphNodeComponent } from './loot-graph-node.component'
import { LootContextEditorComponent } from './loot-context-editor.component'

@Component({
  standalone: true,
  selector: 'nwb-loot-graph',
  template: `
    <!-- <div class="flex flex-row flex-wrap gap-1">
      <span *ngFor="let tag of knownTags$ | async; trackBy: trackByIndex" class="badge badge-sm badge-secondary">
        {{ tag }}
      </span>
    </div> -->
    <!-- <nwb-loot-context-editor></nwb-loot-context-editor> -->
    <nwb-loot-graph-node
      [node]="graph$ | async"
      [showLocked]="showLocked"
      [expand]="true"
      [showChance]="showChance"
      [showLink]="true"
    ></nwb-loot-graph-node>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, LootGraphNodeComponent, LootContextEditorComponent],
  host: {
    class: 'layout-content',
  },
})
export class LootGraphComponent extends ComponentStore<{
  tableId: string
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
  public set tableId(value: string) {
    this.patchState({ tableId: value })
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

  protected tableId$ = this.select((s) => s.tableId)
  protected tags$ = this.select((s) => s.tags)
  protected tagValues$ = this.select((s) => s.tagValues)
  protected dropChance$ = this.select((s) => s.dropChance)
  protected highlight$ = this.select((s) => s.highlight)
  protected fullGraph$ = this.select(
    combineLatest({
      entry: this.db.lootTable(this.tableId$),
      tables: this.db.lootTablesMap,
      buckets: this.db.lootBucketsMap,
    }),
    (params) => buildLootGraph(params),
    { debounce: true }
  )
  protected context$ = this.select(
    combineLatest({
      tags: this.tags$,
      values: this.tagValues$,
    }),
    (params) => LootContext.create(params),
    { debounce: true }
  )
  protected graph$ = this.select(
    combineLatest({
      graph: this.fullGraph$,
      context: this.context$,
      dropChance: this.dropChance$,
      highlight: this.highlight$,
    }),
    ({ graph, context, dropChance, highlight }) => {
      return updateLootGraph({
        graph,
        context: this.showLocked ? null : context,
        dropChance,
        highlight,
      })
    },
    { debounce: true }
  )

  protected knownTags$ = this.select(this.graph$, (graph) => {
    return Array.from(extractLootTagsFromGraph(graph))
  })
  protected trackByIndex = (i: number) => i

  public constructor(private db: NwDbService) {
    super({
      tableId: null,
      tags: [],
      tagValues: {},
      dropChance: 1,
      highlight: null,
    })
  }
}
