import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  OnChanges,
  OnDestroy,
  ViewChild,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  NgZone,
  SimpleChanges,
} from '@angular/core'
import { Crafting, Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { isEqual } from 'lodash'
import { BehaviorSubject, combineLatest, defer, filter, map, shareReplay, Subject, takeUntil } from 'rxjs'
import { LocaleService } from '~/core/i18n'
import { NwService } from '~/core/nw'
import { NwItemMetaService } from '~/core/nw/nw-item-meta.service'
import { AgGridComponent, CategoryFilter } from '~/ui/ag-grid'

function fieldName(key: keyof RecipeWithItem) {
  return key
}

function field<K extends keyof RecipeWithItem>(item: RecipeWithItem, key: K): RecipeWithItem[K] {
  return item[key]
}

export type RecipeWithItem = Crafting & {
  $item: ItemDefinitionMaster | Housingitems
}

@Component({
  selector: 'nwb-crafting-table',
  templateUrl: './crafting-table.component.html',
  styleUrls: ['./crafting-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CraftingTableComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild(AgGridComponent, { static: true })
  public grid: AgGridComponent

  @Input()
  public quickFilter: string

  public get gridData() {
    return this.displayItems
  }

  public gridOptions = this.nw.gridOptions({
    rowSelection: 'single',
    onSelectionChanged: (it) => {
      const ids = it.api.getSelectedRows().map((it) => field(it, 'RecipeID'))
      this.zone.run(() => this.selectionChange.next(ids))
    },
    onRowDataChanged: () => {
      if (this.selection) {
        this.select(this.selection, {
          ensureVisible: true,
        })
      }
    },
    columnDefs: [
      {
        field: fieldName('RecipeID'),
        hide: true,
      },
      {
        field: fieldName('ItemID'),
        hide: true,
      },
      {
        sortable: false,
        filter: false,
        pinned: true,
        width: 54,
        cellRenderer: ({ data }) => {
          const recipe = data as RecipeWithItem
          if (!recipe.$item) {
            return ''
          }
          const rarity = this.nw.itemRarity(recipe.$item)
          const iconPath = this.nw.iconPath(recipe.$item?.IconPath)
          return this.nw.renderIcon(iconPath, {
            size: 38,
            rarity: rarity,
          })
        },
      },
      {
        width: 250,
        headerName: 'Name',
        valueGetter: ({ data }) => {
          const recipe = data as RecipeWithItem
          if (!recipe.$item) {
            return this.nw.translate(recipe.RecipeNameOverride)
          }
          return this.nw.translate(recipe.$item?.Name)
        },
        getQuickFilterText: ({ value }) => value,
      },
      {
        field: fieldName('Tradeskill'),
        filter: CategoryFilter,
      },
      {
        field: fieldName('CraftingCategory'),
        filter: CategoryFilter,
      },
      {
        field: fieldName('CraftingGroup'),
        filter: CategoryFilter,
      },
      {
        field: fieldName('RecipeLevel'),
        // filter: CategoryFilter,
      },
      {
        field: fieldName('BonusItemChance'),
        valueGetter: ({ data }) => `${Math.round((field(data, 'BonusItemChance') || 0) * 100)}%`,
        // filter: CategoryFilter,
      },
      {
        field: fieldName('BonusItemChanceIncrease'),
        filter: false,
        valueGetter: ({ data }) =>
          field(data, 'BonusItemChanceIncrease')
            ?.split(',')
            .map((it) => `${Math.round(Number(it || 0) * 100)}%`)
            .join(' '),
      },
      {
        field: fieldName('BonusItemChanceDecrease'),
        filter: false,
        valueGetter: ({ data }) =>
          field(data, 'BonusItemChanceDecrease')
            ?.split(',')
            .map((it) => `${Math.round(Number(it || 0) * 100)}%`)
            .join(' '),
      },
    ],
  })

  @Input()
  public selection: string[]

  @Output()
  public selectionChange = new EventEmitter<string[]>()

  @Input()
  public filter: (item: Crafting) => boolean

  public category = defer(() => this.category$)
  public categories = defer(() => this.categorie$)

  private items: Crafting[]
  private displayItems: Crafting[]
  private destroy$ = new Subject()
  private category$ = new BehaviorSubject<string>(null)
  private categorie$ = new BehaviorSubject<string[]>(null)

  public constructor(
    private locale: LocaleService,
    private nw: NwService,
    private cdRef: ChangeDetectorRef,
    private zone: NgZone,
    private meta: NwItemMetaService
  ) {
    //
  }

  public async ngOnInit() {
    const item$ = combineLatest({
      items: this.nw.db.itemsMap,
      housing: this.nw.db.housingItemsMap,
      recipes: this.nw.db.recipes,
    })
      .pipe(
        map(({ items, housing, recipes }) => {
          recipes = recipes.filter((it) => !!it.Tradeskill)
          if (this.filter) {
            recipes = recipes.filter(this.filter)
          }
          return recipes.map<RecipeWithItem>((it) => {
            const itemId =
              it.ItemID ||
              it.ProceduralTierID1 ||
              it.ProceduralTierID2 ||
              it.ProceduralTierID3 ||
              it.ProceduralTierID4 ||
              it.ProceduralTierID5
            return {
              ...it,
              $item: items.get(itemId) || housing.get(itemId),
            }
          })
        })
      )
      .pipe(
        shareReplay({
          refCount: true,
          bufferSize: 1,
        })
      )

    item$
      .pipe(map((items) => Array.from(new Set(items.map((it) => it.Tradeskill).filter((it) => !!it)))))
      .pipe(takeUntil(this.destroy$))
      .subscribe((cats) => this.categorie$.next(cats))

    combineLatest({
      items: item$,
      // perks: perk$,
      category: this.category$,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ items, category }) => {
        this.items = items
        this.displayItems = category ? items.filter((it) => it.Tradeskill === category) : items
        this.cdRef.markForCheck()
      })

    this.locale.change
      .pipe(filter(() => !!this.grid?.api))
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.grid.api.refreshCells({ force: true })
      })
  }

  public ngOnChanges(changes: SimpleChanges) {
    const selection = this.getChange(changes, 'selection')
    if (selection) {
      this.select(selection.currentValue)
    }
    if (this.getChange(changes, 'quickFilter')) {
      this.cdRef.markForCheck()
    }
  }

  public ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  public setCategory(category: string) {
    this.category$.next(category)
  }

  private getChange(ch: SimpleChanges, key: keyof CraftingTableComponent) {
    return ch[key]
  }

  private select(toSelect: string[], options?: { ensureVisible: boolean }) {
    const api = this.grid?.api
    if (!api) {
      return
    }
    if (
      isEqual(
        toSelect,
        api.getSelectedRows().map((it) => field(it, 'RecipeID'))
      )
    ) {
      return
    }
    api.forEachNode((it) => {
      if (toSelect && toSelect.includes(field(it.data, 'RecipeID'))) {
        it.setSelected(true, false, true)
      } else if (it.isSelected()) {
        it.setSelected(false, false, true)
      }
    })
    if (options?.ensureVisible) {
      const selectedNode = api.getSelectedNodes()?.[0]
      if (selectedNode) {
        api.ensureNodeVisible(selectedNode, 'middle')
      }
    }
  }
}
