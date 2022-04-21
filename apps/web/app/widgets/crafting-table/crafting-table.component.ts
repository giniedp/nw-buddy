import { Component, OnInit, ChangeDetectionStrategy, OnChanges, OnDestroy, ViewChild, Input, Output, EventEmitter, ChangeDetectorRef, NgZone, SimpleChanges } from '@angular/core';
import { Crafting } from '@nw-data/types';
import { isEqual } from 'lodash';
import { BehaviorSubject, combineLatest, defer, filter, map, Subject, takeUntil } from 'rxjs';
import { LocaleService } from '~/core/i18n';
import { NwService } from '~/core/nw';
import { NwItemMetaService } from '~/core/nw/nw-item-meta.service';
import { AgGridComponent, CategoryFilter } from '~/ui/ag-grid';


function fieldName(key: keyof Crafting) {
  return key
}

function field(item: any, key: keyof Crafting) {
  return item[key]
}


@Component({
  selector: 'nwb-crafting-table',
  templateUrl: './crafting-table.component.html',
  styleUrls: ['./crafting-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
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
      // {
      //   sortable: false,
      //   filter: false,
      //   width: 74,
      //   cellRenderer: ({ data }) => {
      //     const rarity = this.nw.itemRarity(data)
      //     const iconPath = this.nw.iconPath(field(data, ''))
      //     const icon = this.nw.renderIcon(iconPath, {
      //       size: 38,
      //       rarity: rarity,
      //     })
      //     return `<a href="${this.nw.nwdbLinkUrl('item', field(data, 'ItemID'))}" target="_blank">${icon}</a>`
      //   },
      // },
      // {
      //   width: 250,
      //   headerName: 'Name',
      //   valueGetter: ({ data }) => this.nw.translate(field(data, '')),
      //   getQuickFilterText: ({ value }) => value
      // },
      {
        field: fieldName('RecipeID'),
        // hide: true,
      },
      {
        field: fieldName('ItemID'),
        // hide: true,
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
        // filter: CategoryFilter,
      },
      {
        field: fieldName('BonusItemChanceIncrease'),
        // filter: CategoryFilter,
      },
      {
        field: fieldName('BonusItemChanceDecrease'),
        // filter: CategoryFilter,
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
    const item$ = this.nw.db.recipes.pipe(map((items) => (this.filter ? items.filter(this.filter) : items)))

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
