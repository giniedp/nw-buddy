import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy, Input, ChangeDetectorRef, OnChanges } from '@angular/core'
import { BehaviorSubject, combineLatest, map, ReplaySubject, switchMap } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { LootContext } from '~/nw/loot'
import { buildLootGraph, extractLootTagsFromGraph, updateLootGraph } from '~/nw/loot/loot-graph'
import { shareReplayRefCount, tapDebug } from '~/utils'
import { LootGraphNodeComponent } from './loot-graph-node.component'

@Component({
  standalone: true,
  selector: 'nwb-loot-graph',
  templateUrl: './loot-graph.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, LootGraphNodeComponent],
  host: {
    class: 'layout-content',
  },
})
export class LootGraphComponent {
  @Input()
  public set tableId(value: string) {
    this.tableId$.next(value)
  }

  @Input()
  public set tags(value: string[]) {
    this.tags$.next(value)
  }

  @Input()
  public set tagValues(value: Record<string, string | number>) {
    this.tagValues$.next(value)
  }

  @Input()
  public showLocked = false

  @Input()
  public showChance = false

  @Input()
  public set dropChance(value: number) {
    this.dropChance$.next(value)
  }

  @Input()
  public set highlight(value: string) {
    this.highlight$.next(value)
  }

  private tableId$ = new ReplaySubject<string>(1)
  private tags$ = new BehaviorSubject<string[]>([])
  private tagValues$ = new BehaviorSubject<Record<string, string | number>>({})
  private dropChance$ = new BehaviorSubject(1)
  private highlight$ = new BehaviorSubject<string>(null)

  protected graph$ = combineLatest({
    graph: this.observeGraph(),
    context: this.observeContext(),
    dropChance: this.dropChance$,
    highlight: this.highlight$
  }).pipe(map(({ graph, context, dropChance, highlight }) => {
    return updateLootGraph({
      graph,
      context,
      dropChance,
      highlight
    })
  }))
  .pipe(shareReplayRefCount(1))

  protected knownTags$ = this.graph$.pipe(map((graph) => {
    return extractLootTagsFromGraph(graph)
  }))

  public constructor(private db: NwDbService) {
    //
  }

  private observeGraph() {
    return combineLatest({
      table: this.db.lootTable(this.tableId$),
      tables: this.db.lootTablesMap,
      buckets: this.db.lootBucketsMap,
    }).pipe(
      map(({ table, tables, buckets }) => {
        return buildLootGraph({
          entry: table,
          tables,
          buckets,
        })
      })
    )
  }

  private observeContext() {
    return combineLatest({
      tags: this.tags$,
      values: this.tagValues$
    }).pipe(map(({ tags, values }) => {
      return LootContext.create({
        tags: tags,
        values: values
      })
    }))
  }
}
