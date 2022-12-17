import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy, Input } from '@angular/core'
import { BehaviorSubject, combineLatest, defer, map, ReplaySubject } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { LootTableEntry, LootTableItem } from '~/nw/utils'
import { IconsModule } from '~/ui/icons'
import { svgAngleLeft } from '~/ui/icons/svg'
import { PropertyGridModule } from '~/ui/property-grid'
import { CaseInsensitiveSet, shareReplayRefCount } from '~/utils'
import { ItemDetailModule } from '../item-detail'
import { LootBucketList } from './loot-bucket-list.component'

@Component({
  standalone: true,
  selector: 'nwb-loot-table-entry',
  templateUrl: './loot-table-entry.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, PropertyGridModule, LootBucketList, ItemDetailModule, IconsModule],
  host: {
    class: 'layout-col border border-base-100 rounded-md bg-base-200',
  },
})
export class LootTableEntryComponent {
  @Input()
  public set tableId(value: string) {
    this.tableId$.next(value)
  }

  @Input()
  public set expand(value: boolean) {
    this.expand$.next(value)
  }

  @Input()
  public hideID = false

  @Input()
  public set highlightIds(value: string[]) {
    this.highlight$.next(value || [])
  }
  public get highlightIds() {
    return this.highlight$.value
  }

  protected iconExpand = svgAngleLeft

  protected vm$ = defer(() =>
    combineLatest({
      table: this.db.lootTable(this.tableId$),
      highlight: this.highlight$,
    })
  )
    .pipe(
      map(({ table, highlight }) => {
        return {
          table: table,
          highlight: highlight.includes(table.LootTableID),
          items: table.Items.map((item) => {
            return {
              item: item,
              expand: highlight.includes(item.ItemID || item.LootBucketID || item.LootTableID),
            }
          }),
        }
      })
    )
    .pipe(shareReplayRefCount(1))

  protected tableId$ = new BehaviorSubject<string>(null)
  protected expand$ = new BehaviorSubject(false)
  protected highlight$ = new BehaviorSubject<string[]>([])

  public constructor(private db: NwDbService) {
    //
  }

  protected toggle() {
    this.expand$.next(!this.expand$.value)
  }
}
