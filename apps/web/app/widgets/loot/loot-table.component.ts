import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  Input,
  OnChanges,
  OnInit
} from '@angular/core'
import { GridOptions } from 'ag-grid-community'
import { sortBy, uniqBy } from 'lodash'
import { BehaviorSubject, combineLatest, defer, map, Observable, of, startWith, switchMap } from 'rxjs'

import { Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { TranslateService } from '~/i18n'
import { nwdbLinkUrl, NwDbService, NwLootbucketService } from '~/nw'
import { LootContext } from '~/nw/nw-lootcontext'
import {
  getItemIconPath,
  getItemId,
  getItemRarity,
  getItemRarityLabel,
  getItemTierAsRoman,
  LootTableEntry,
  LootTableItem
} from '~/nw/utils'
import { SelectboxFilter } from '~/ui/ag-grid'
import { DataTableAdapter } from '~/ui/data-table'
import { QuicksearchService } from '~/ui/quicksearch'
import { shareReplayRefCount } from '~/utils'

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
    QuicksearchService,
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

  @Input()
  public set enemyLevel(value: number) {
    this.enemyLevel$.next(value || null)
  }

  @Input()
  public set playerLevel(value: number) {
    this.playerLevel$.next(value || null)
  }

  public table$ = defer(() => this.tableId$)
    .pipe(switchMap((id) => this.db.lootTable(id)))
    .pipe(shareReplayRefCount(1))

  public context$ = defer(() => {
    return combineLatest({
      tags: this.tags$,
      enemyLevel: this.enemyLevel$,
      playerLevel: this.playerLevel$,
    })
  }).pipe(
    map(({ tags, enemyLevel, playerLevel }) => {
      return LootContext.create({
        tags: [
          'GlobalMod',          // unknown purpose
          // 'MinContLevel',    // any zone
          // 'MinPOIContLevel', // any zone
          ...tags,
        ],
        values: {
          MinContLevel: enemyLevel,
          MinPOIContLevel: enemyLevel,
          EnemyLevel: enemyLevel,
          Level: playerLevel,
        },
      })
    })
  )

  public override entities: Observable<Item[]> = defer(() => {
    return combineLatest({
      context: this.context$,
      table: this.table$,
    })
  })
    .pipe(switchMap(({ table, context }) => this.fetchTableItems(table, context)))
    .pipe(shareReplayRefCount(1))

  private tableId$ = new BehaviorSubject<string>(null)
  private tags$ = new BehaviorSubject<string[]>([])
  private enemyLevel$ = new BehaviorSubject<number>(0)
  private playerLevel$ = new BehaviorSubject<number>(60)

  constructor(
    private cdRef: ChangeDetectorRef,
    private db: NwDbService,
    private lbs: NwLootbucketService,
    private i18n: TranslateService,
    public search: QuicksearchService
  ) {
    super()
  }

  public ngOnInit(): void {
    //
  }

  public ngOnChanges(): void {
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

  private fetchTableItems(table: LootTableEntry, context: LootContext): Observable<Item[]> {
    if (!table) {
      return of([])
    }
    const items = context.accessLoottable(table)
    return combineLatest(items.map((it) => this.fetchItems(it, context)))
      .pipe(map((it) => it.flat(1)))
      .pipe(map((it) => uniqBy(it, (el) => getItemId(el))))
      .pipe(map((list) => sortBy(list, (it) => getItemRarity(it)).reverse()))
      .pipe(startWith([]))
  }

  private fetchItems(item: LootTableItem, context: LootContext): Observable<Item[]> {
    if (item.ItemID) {
      return combineLatest({
        items: this.db.itemsMap,
        housings: this.db.housingItemsMap,
      })
        .pipe(map(({ items, housings }) => items.get(item.ItemID) || housings.get(item.ItemID)))
        .pipe(map((it) => (it ? [it] : [])))
    }
    if (item.LootBucketID) {
      return this.lbs
        .bucket(item.LootBucketID)
        .filter((entry) => context.accessLootbucket(entry))
        .items()
    }
    if (item.LootTableID) {
      return this.fetchTable(item.LootTableID).pipe(switchMap((table) => this.fetchTableItems(table, context)))
    }
    return of<Item[]>([])
  }

  public options = defer(() =>
    of<GridOptions>({
      rowSelection: 'single',
      columnDefs: [
        {
          sortable: false,
          filter: false,
          width: 62,
          pinned: true,
          cellRenderer: this.cellRenderer(({ data }) => {
            return this.createLinkWithIcon({
              target: '_blank',
              href: nwdbLinkUrl('item', getItemId(data)),
              icon: getItemIconPath(data),
              rarity: getItemRarity(data)
            })
          }),
        },
        {
          width: 250,
          headerName: 'Name',
          valueGetter: this.valueGetter(({ data }) => this.i18n.get(data.Name)),
          cellRenderer: this.cellRenderer(({ value }) => value?.replace(/\\n/g, '<br>')),
          cellClass: ['multiline-cell', 'py-2'],
          autoHeight: true,
          getQuickFilterText: ({ value }) => value,
        },
        {
          headerName: 'Rarity',
          valueGetter: ({ data }) => getItemRarity(data),
          valueFormatter: ({ value }) => this.i18n.get(getItemRarityLabel(value)),
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
    ))
}
