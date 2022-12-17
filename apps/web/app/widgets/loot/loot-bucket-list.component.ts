import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy, Input } from '@angular/core'
import { sortBy } from 'lodash'
import { BehaviorSubject, combineLatest, defer, map } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { LootBucketEntry } from '~/nw/utils'
import { IconsModule } from '~/ui/icons'
import { svgAngleLeft } from '~/ui/icons/svg'
import { shareReplayRefCount, tapDebug } from '~/utils'
import { ItemDetailModule } from '../item-detail'

@Component({
  standalone: true,
  selector: 'nwb-loot-bucket-list',
  templateUrl: './loot-bucket-list.component.html',
  styleUrls: ['./loot-bucket-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemDetailModule, IconsModule],
  host: {
    class: 'layout-col border border-base-100 rounded-md bg-base-200',
  },
})
export class LootBucketList {
  @Input()
  public set bucketId(value: string) {
    this.bucketId$.next(value)
  }
  @Input()
  public set expand(value: boolean) {
    this.expand$.next(value)
  }
  @Input()
  public set highlightIds(value: string[]) {
    this.highlight$.next(value || [])
  }
  public get highlightIds() {
    return this.highlight$.value
  }

  protected get ishighlighted() {
    return this.highlightIds.includes(this.bucketId$.value)
  }

  protected iconExpand = svgAngleLeft

  protected expand$ = new BehaviorSubject(false)
  protected highlight$ = new BehaviorSubject<string[]>([])
  protected bucketId$ = new BehaviorSubject<string>(null)
  protected items$ = combineLatest({
    items: this.db.lootBucket(this.bucketId$),
    highlight: this.highlight$,
  })
    .pipe(
      map(({ items }) => {
        return sortBy(items, (item) => (this.shouldHighlight(item.Item) ? -1 : 0))
      })
    )
    .pipe(shareReplayRefCount(1))

  protected count$ = this.items$.pipe(map((it) => it.length))
  protected trackByIndex = (i: number) => i

  public constructor(private db: NwDbService) {
    //
  }

  protected toggle() {
    this.expand$.next(!this.expand$.value)
  }

  protected shouldHighlight(id: string) {
    return this.highlightIds.includes(id)
  }
}
