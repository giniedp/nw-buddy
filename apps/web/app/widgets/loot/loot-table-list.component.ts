import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { combineLatest, map } from 'rxjs'
import { NwModule } from '~/nw'
import { LootItemWithNodes, LootNode } from '~/nw/loot'
import { CaseInsensitiveSet, tapDebug } from '~/utils'
import { LootTableEntryComponent } from './loot-table-entry.component'
import { LootTableListStore } from './loot-table-list.store'

@Component({
  standalone: true,
  selector: 'nwb-loot-table-list',
  templateUrl: './loot-table-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, LootTableEntryComponent],
  providers: [LootTableListStore],
  host: {
    class: 'layout-content',
  },
})
export class LootTableListComponent {

  @Input()
  public set highlight(value: LootItemWithNodes) {
    this.store.setHighlight(Array.from(collectRefs(value.nodes)))
    this.store.setTables(Array.from(rootIds(value.nodes)))
  }

  protected rows$ = combineLatest({
    rows: this.store.rootTables$,
    highlight: this.store.highlight$
  }).pipe(map(({ rows, highlight }) => {
    return rows.map((row) => {
      return {
        id: row.LootTableID,
        expand: highlight.includes(row.LootTableID),
        highlight
      }
    })
  }))
  .pipe(tapDebug('rows'))

  public constructor(private store: LootTableListStore) {
    //
  }

  protected shouldExpand(id: string, highlight: string[]) {
    return highlight?.includes(id)
  }
}

function collectRefs(nodes: LootNode[], ids: Set<string> = new Set()) {
  for (const node of nodes) {
    ids.add(node.ref)
    if (node.parent) {
      collectRefs([node.parent], ids)
    }
  }
  return ids
}

function rootIds(nodes: LootNode[], ids: Set<string> = new Set())  {
  for (const node of nodes) {
    if (node.parent) {
      rootIds([node.parent], ids)
    } else {
      ids.add(node.ref)
    }
  }
  return ids
}
