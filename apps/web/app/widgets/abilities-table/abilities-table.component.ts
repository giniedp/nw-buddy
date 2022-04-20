import { Component, OnInit, ChangeDetectionStrategy, OnChanges, OnDestroy, ViewChild, Input, Output, EventEmitter, NgZone, ChangeDetectorRef, SimpleChanges } from '@angular/core';
import { Ability } from '@nw-data/types';
import { isEqual } from 'lodash';
import { BehaviorSubject, combineLatest, defer, filter, map, Subject, takeUntil } from 'rxjs';
import { AgGridComponent } from '~/ui/ag-grid';
import { LocaleService } from '~/core/i18n';
import { NwService } from '~/core/nw';

function fieldName(key: keyof Ability) {
  return key
}

function field<K extends keyof Ability>(item: Ability, key: K): Ability[K] {
  return item[key]
}


@Component({
  selector: 'nwb-abilities-table',
  templateUrl: './abilities-table.component.html',
  styleUrls: ['./abilities-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AbilitiesTableComponent implements OnInit, OnChanges, OnDestroy {

  @ViewChild(AgGridComponent, { static: true })
  public grid: AgGridComponent

  public get gridData() {
    return this.displayItems
  }

  public gridOptions = this.nw.gridOptions({
    rowSelection: 'single',
    onSelectionChanged: (it) => {
      const ids = it.api.getSelectedRows().map((it) => field(it, 'AbilityID'))
      this.zone.run(() => this.selectionChange.next(ids))
    },
    onRowDataChanged: () => {
      if (this.selection) {
        this.select(this.selection, {
          ensureVisible: true
        })
      }
    },
    columnDefs: [
      {
        sortable: false,
        filter: false,
        width: 74,
        cellRenderer: ({ data }) => {
          const rarity = this.nw.itemRarity(data)
          const iconPath = this.nw.iconPath(field(data, 'Icon') || data.IconPath)
          const icon = this.nw.renderIcon(iconPath, {
            size: 38,
            rarity: rarity,
          })
          return `<a href="${this.nw.nwdbLinkUrl('ability', field(data, 'AbilityID'))}" target="_blank">${icon}</a>`
        },
      },
      {
        headerName: 'Name',
        valueGetter: ({ data }) => {
          return this.nw.translate(field(data, 'DisplayName'))
        },
        width: 300,
      },
      // {
      //   field: fieldName('Description'),
      //   cellRenderer: this.nw.cellRendererAsync<Ability>((data) => {
      //     return this.nw.expression.solve({
      //       text: this.nw.translate(data.Description),
      //       charLevel: 60,
      //       itemId: data.AbilityID
      //     })
      //   }),
      //   width: 300,
      //   filter: false,
      // },
      {
        field: fieldName('WeaponTag'),
      },
      {
        field: fieldName('AttackType'),
      },
    ],
  })

  @Input()
  public selection: string[]

  @Output()
  public selectionChange = new EventEmitter<string[]>()


  @Input()
  public filter: (item: Ability) => boolean

  public category = defer(() => this.category$)
  public categories = defer(() => this.categorie$)

  private abilities: Ability[]
  private displayItems: Ability[]
  private destroy$ = new Subject()
  private category$ = new BehaviorSubject<string>(null)
  private categorie$ = new BehaviorSubject<string[]>(null)

  public constructor(
    private locale: LocaleService,
    private nw: NwService,
    private cdRef: ChangeDetectorRef,
    private zone: NgZone
  ) {
    //
  }

  public ngOnInit(): void {
    const abilitie$ = this.nw.db.abilities
      .pipe(map((items) => (this.filter ? items.filter(this.filter) : items)))
      .pipe(map((items) => items.filter((it) => !!it.WeaponTag) ))

    abilitie$
      .pipe(map((items) => Array.from(new Set(items.map((it) => it.WeaponTag).filter((it) => !!it)))))
      .pipe(takeUntil(this.destroy$))
      .subscribe((cats) => this.categorie$.next(cats))

    combineLatest({
      abilities: abilitie$,
      items: this.nw.db.itemsMap,
      category: this.category$,
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe(({ abilities, items, category }) => {
      this.abilities = abilities
      this.displayItems = category ? abilities.filter((it) => it.WeaponTag === category) : abilities
      // this.items = items
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
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  public setCategory(category: string) {
    this.category$.next(category)
  }

  private getChange(ch: SimpleChanges, key: keyof AbilitiesTableComponent) {
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
        api.getSelectedRows().map((it) => field(it, 'AbilityID'))
      )
    ) {
      return
    }
    api.forEachNode((it) => {
      if (toSelect && toSelect.includes(field(it.data, 'AbilityID'))) {
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
