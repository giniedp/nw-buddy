import {
  Component,
  OnInit,
  Input,
  forwardRef,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { BehaviorSubject, combineLatest, defer, map, Observable, of, ReplaySubject, switchMap, tap } from 'rxjs'
import { IconComponent, LootbucketService, nwdbLinkUrl, NwDbService } from '~/core/nw'
import {
  getItemId,
  getItemRarity,
  getItemRarityName,
  getItemTierAsRoman,
  LootTableEntry,
  LootTableItem,
} from '~/core/nw/utils'
import { shareReplayRefCount } from '~/core/utils'
import { DataTableAdapter } from '~/ui/data-table'
import m from 'mithril'
import { SelectboxFilter } from '~/ui/ag-grid'
import { TranslateService } from '~/core/i18n'
import { sortBy, uniqBy } from 'lodash'

type Item = ItemDefinitionMaster | Housingitems
@Component({
  selector: 'nwb-loot-table',
  templateUrl: './loot-table.component.html',
  styleUrls: ['./loot-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: DataTableAdapter,
      useExisting: forwardRef(() => LootTableComponent),
    },
  ],
})
export class LootTableComponent extends DataTableAdapter<Item> implements OnInit, OnChanges {
  @Input()
  public set tableId(value: string) {
    this.tableId$.next(value)
  }

  @Input()
  public set tags(value: string[]) {
    this.tags$.next(value || [])
  }

  public table = defer(() => this.tableId$)
    .pipe(switchMap((id) => this.db.lootTable(id)))
    .pipe(shareReplayRefCount(1))

  public override entities: Observable<Item[]> = defer(() => {
    return combineLatest({
      table: this.table,
      tags: this.tags$,
    })
  })
    .pipe(switchMap(({ table, tags }) => this.fetchTableItems(table, tags)))

    .pipe(shareReplayRefCount(1))

  private tableId$ = new ReplaySubject<string>(1)
  private tags$ = new BehaviorSubject<string[]>([])

  constructor(
    private cdRef: ChangeDetectorRef,
    private db: NwDbService,
    private lbs: LootbucketService,
    private i18n: TranslateService
  ) {
    super()
  }

  public ngOnInit(): void {
    //
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.cdRef.detectChanges()
  }

  public entityID(item: Item): string {
    return getItemId(item)
  }

  public entityCategory(item: Item): string {
    throw null
  }

  private fetchTable(tableId: string) {
    return this.db.lootTable(tableId)
  }

  private fetchTableItems(table: LootTableEntry, tags: string[]) {
    if (!table) {
      return of<Item[]>([])
    }
    return combineLatest(table.Items.map((it) => this.fetchItems(it, tags)))
      .pipe(map((it) => it.flat(1)))
      .pipe(map((it) => uniqBy(it, (el) => getItemId(el))))
      .pipe(map((list) => {
        return sortBy(list, (it) => 5 - getItemRarity(it))
      }))
  }

  private fetchItems(item: LootTableItem, tags: string[]): Observable<Item[]> {
    if (item.ItemID) {
      return combineLatest({
        items: this.db.itemsMap,
        housings: this.db.housingItemsMap,
      })
        .pipe(map(({ items, housings }) => items.get(item.ItemID) || housings.get(item.ItemID)))
        .pipe(map((it) => (it ? [it] : [])))
    }
    if (item.LootBucketID) {
      let q = this.lbs.bucket(item.LootBucketID)
      if (tags?.length) {
        q = q.filter(tags)
      }
      return q.items()
    }
    if (item.LootTableID) {
      return this.fetchTable(item.LootTableID).pipe(switchMap((table) => this.fetchTableItems(table, tags)))
    }
    return of<Item[]>([])
  }

  public buildGridOptions(base: GridOptions): GridOptions {
    return {
      ...base,
      rowSelection: 'single',
      columnDefs: [
        {
          sortable: false,
          filter: false,
          width: 54,
          pinned: true,
          cellRenderer: this.mithrilCell({
            view: ({ attrs: { data } }) =>
              m('a', { target: '_blank', href: nwdbLinkUrl('item', getItemId(data)) }, [
                m(IconComponent, {
                  src: data.IconPath,
                  class: `w-9 h-9 nw-icon bg-rarity-${getItemRarity(data)}`,
                }),
              ]),
          }),
        },
        {
          width: 250,
          headerName: 'Name',
          valueGetter: this.valueGetter(({ data }) => this.i18n.get(data.Name)),
          getQuickFilterText: ({ value }) => value,
        },
        {
          headerName: 'Rarity',
          valueGetter: ({ data }) => getItemRarity(data),
          valueFormatter: ({ value }) => this.i18n.get(getItemRarityName(value)),
          filter: SelectboxFilter,
          width: 130,
          getQuickFilterText: ({ value }) => value,
        },
        {
          width: 80,
          field: this.fieldName('Tier'),
          valueGetter: ({ data }) => getItemTierAsRoman(data.Tier),
          filter: SelectboxFilter,
        },
      ],
    }
  }
}
