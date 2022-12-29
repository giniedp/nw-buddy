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
import { BehaviorSubject, combineLatest, defer, map, Observable, of, switchMap } from 'rxjs'

import { CommonModule } from '@angular/common'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { TranslateService } from '~/i18n'
import { NwDbService, NwLinkService } from '~/nw'
import { LootContext, NwLootService } from '~/nw/loot'
import {
  getItemIconPath,
  getItemId,
  getItemRarity,
  getItemRarityLabel,
  getItemTierAsRoman,
  isItemArmor,
  isItemNamed,
  isItemWeapon,
  isMasterItem
} from '~/nw/utils'
import { SelectboxFilter } from '~/ui/ag-grid'
import { DataTableAdapter, DataTableModule } from '~/ui/data-table'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { shareReplayRefCount } from '~/utils'

type Item = ItemDefinitionMaster | Housingitems
@Component({
  standalone: true,
  selector: 'nwb-loot-table',
  templateUrl: './loot-table.component.html',
  styleUrls: ['./loot-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DataTableModule, QuicksearchModule],
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
    this.tags$.next(value)
  }

  @Input()
  public set tagValues(value: Record<string, string | number>) {
    this.tagValues$.next(value)
  }

  public table$ = defer(() => this.db.lootTable(this.tableId$))

  public context$ = defer(() => {
    return combineLatest({
      tags: this.tags$,
      values: this.tagValues$,
    })
  }).pipe(
    map(({ tags, values }) => {
      return new LootContext({
        tags: tags,
        values: values,
      })
    })
  )

  public override entities: Observable<Item[]> = defer(() => {
    return combineLatest({
      context: this.context$,
      table: this.table$,
    })
  })
    .pipe(switchMap(({ table, context }) => this.loot.resolveLootItems(table, context)))
    .pipe(map((items) => this.filterAndSort(items)))
    .pipe(shareReplayRefCount(1))

  private tableId$ = new BehaviorSubject<string>(null)
  private tags$ = new BehaviorSubject<string[]>([])
  private tagValues$ = new BehaviorSubject<Record<string, string|number>>({})

  constructor(
    private cdRef: ChangeDetectorRef,
    private db: NwDbService,
    private loot: NwLootService,

    private i18n: TranslateService,
    public search: QuicksearchService,
    private info: NwLinkService
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
              href: this.info.link('item', getItemId(data)),
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


  private filterAndSort(items: Array<ItemDefinitionMaster | Housingitems>) {
    return items
      .sort((nodeA, nodeB) => {
        const a = nodeA
        const b = nodeB
        const isGearA = isMasterItem(a) && (isItemArmor(a) || isItemWeapon(a))
        const isGearB = isMasterItem(b) && (isItemArmor(b) || isItemWeapon(b))
        if (isGearA !== isGearB) {
          return isGearA ? -1 : 1
        }
        const isNamedA = isMasterItem(a) && isItemNamed(a)
        const isNamedB = isMasterItem(b) && isItemNamed(b)
        if (isNamedA !== isNamedB) {
          return isNamedA ? -1 : 1
        }
        const rarrityA = getItemRarity(a)
        const rarrityB = getItemRarity(b)
        if (rarrityA !== rarrityB) {
          return rarrityA >= rarrityB ? -1 : 1
        }
        return getItemId(a).localeCompare(getItemId(b))
      })
  }
}
