import { ChangeDetectionStrategy, Component, Input, Output, inject } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { patchState } from '@ngrx/signals'
import { uniq } from 'lodash'
import { combineLatest, map, of, skip, switchMap } from 'rxjs'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { LootNode, buildLootGraph, updateLootGraph } from '~/nw/loot/loot-graph'
import { selectSignal, selectStream } from '~/utils'
import { LootGraphNodeComponent } from './loot-graph-node.component'
import { LootGraphService } from './loot-graph.service'
import { LootGraphStore } from './loot-graph.store'

@Component({
  selector: 'nwb-loot-graph',
  templateUrl: './loot-graph.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NwModule,
    LootGraphNodeComponent,
    //LootContextEditorComponent
  ],
  providers: [LootGraphStore, LootGraphService],
  host: {
    class: 'flex flex-col gap-2',
  },
})
export class LootGraphComponent {
  private service = inject(LootGraphService)
  private store = inject(LootGraphStore)
  private db = injectNwData()

  @Input()
  public set showLocked(value: boolean) {
    patchState(this.store, { showLocked: value })
  }
  public get showLocked() {
    return this.store.showLocked()
  }
  @Output()
  public showLockedChange = toObservable(this.store.showLocked).pipe(skip(1))

  @Input()
  public set showChance(value: boolean) {
    patchState(this.store, { showChance: value })
  }
  public get showChance() {
    return this.store.showChance()
  }
  @Output()
  public showChanceChange = toObservable(this.store.showChance).pipe(skip(1))

  @Input()
  public set showStats(value: boolean) {
    patchState(this.store, { showStats: value })
  }

  @Input()
  public set tagsEditable(value: boolean) {
    patchState(this.store, { tagsEditable: value })
  }

  @Input()
  public expand = true

  @Input()
  public showLink = true

  @Input()
  public set tableId(value: string | string[]) {
    if (Array.isArray(value)) {
      patchState(this.store, { tableIds: value })
    } else if (typeof value === 'string') {
      patchState(this.store, { tableIds: [value] })
    } else {
      patchState(this.store, { tableIds: [] })
    }
  }

  @Input()
  public set tags(value: string[]) {
    patchState(this.store, { tags: value })
  }

  @Input()
  public set tagValues(value: Record<string, string | number>) {
    patchState(this.store, { tagValues: value })
  }

  @Input()
  public set dropChance(value: number) {
    patchState(this.store, { dropChance: value })
  }

  @Input()
  public set highlight(value: string) {
    patchState(this.store, { highlight: value })
  }
  public get highlight() {
    return this.store.highlight()
  }

  @Input()
  public set showHighlightPicker(value: boolean) {
    patchState(this.store, { highlightPicker: value })
  }
  public get showHighlightPicker() {
    return this.store.highlightPicker()
  }

  @Output()
  public addTagClicked = this.service.addTagClicked

  @Output()
  public removeTagClicked = this.service.removeTagClicked

  protected graph = selectSignal(
    {
      graph: toObservable(this.store.tableIds).pipe(
        map((ids) => uniq(ids || []).sort()),
        switchMap((ids) => this.lootGraph(ids)),
      ),
      context: this.store.context,
      dropChance: this.store.dropChance,
      highlight: this.store.highlight,
    },
    ({ graph, context, dropChance, highlight }) => {
      if (!graph) {
        return null
      }
      return graph.map((it) => {
        return updateLootGraph({
          graph: it,
          context,
          dropChance,
          highlight,
        })
      })
    },
  )

  private lootGraph(tableIds: string[]) {
    if (!tableIds || !tableIds.length) {
      return of<LootNode[]>([])
    }
    return combineLatest(tableIds.map((tableId) => this.lootGraphForTable(tableId)))
  }

  private lootGraphForTable(tableId: string) {
    return selectStream(
      {
        entry: this.db.lootTablesById(tableId),
        tables: this.db.lootTablesByIdMap(),
        buckets: this.db.lootBucketsByIdMap(),
      },
      (data) => buildLootGraph(data),
    )
  }
}
