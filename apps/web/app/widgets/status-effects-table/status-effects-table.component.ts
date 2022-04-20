import { Component, OnInit, ChangeDetectionStrategy, OnChanges, OnDestroy, ViewChild, Input, Output, EventEmitter, NgZone, ChangeDetectorRef, SimpleChanges } from '@angular/core';
import { Statuseffect } from '@nw-data/types';
import { isEqual } from 'lodash';
import { BehaviorSubject, combineLatest, defer, filter, map, Subject, takeUntil } from 'rxjs';
import { AgGridComponent } from '~/ui/ag-grid';
import { LocaleService } from '~/core/i18n';
import { NwService } from '~/core/nw';

function fieldName(key: keyof Statuseffect) {
  return key
}

function field<K extends keyof Statuseffect>(item: Statuseffect, key: K): Statuseffect[K] {
  return item[key]
}


@Component({
  selector: 'nwb-status-effects-table',
  templateUrl: './status-effects-table.component.html',
  styleUrls: ['./status-effects-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusEffectsTableComponent implements OnInit, OnChanges, OnDestroy {

  @ViewChild(AgGridComponent, { static: true })
  public grid: AgGridComponent

  public get gridData() {
    return this.displayItems
  }

  public gridOptions = this.nw.gridOptions({
    rowSelection: 'single',
    onSelectionChanged: (it) => {
      const ids = it.api.getSelectedRows().map((it) => field(it, 'StatusID'))
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
          const iconPath = this.nw.iconPath(field(data, 'PlaceholderIcon') || data.IconPath)
          const icon = this.nw.renderIcon(iconPath, {
            size: 38,
            rarity: rarity,
          })
          return `<a href="${this.nw.nwdbLinkUrl('status-effect', field(data, 'StatusID'))}" target="_blank">${icon}</a>`
        },
      },
      {
        headerName: 'Name',
        valueGetter: ({ data }) => {
          return this.nw.translate(field(data, 'DisplayName'))
        },
        width: 300,
      },
      {
        field: fieldName('EffectCategories'),
      },
      {
        field: fieldName('EffectDurationMods'),
      },
      {
        field: fieldName('EffectPotencyMods'),
      },
    ],
  })

  @Input()
  public selection: string[]

  @Output()
  public selectionChange = new EventEmitter<string[]>()

  @Input()
  public filter: (item: Statuseffect) => boolean

  public category = defer(() => this.category$)
  public categories = defer(() => this.categorie$)

  private effects: Statuseffect[]
  private displayItems: Statuseffect[]
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
    const effect$ = this.nw.db.statusEffects.pipe(map((items) => (this.filter ? items.filter(this.filter) : items)))

    effect$
      .pipe(map((items) => Array.from(new Set(items.map((it) => it['$source']).filter((it) => !!it)))))
      .pipe(takeUntil(this.destroy$))
      .subscribe((cats) => this.categorie$.next(cats))

    combineLatest({
      effects: this.nw.db.statusEffects,
      category: this.category$,
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe(({ effects, category }) => {
      this.effects = effects.filter((it) => !!it.DisplayName)
      this.displayItems = category ? effects.filter((it) => it['$source'] === category) : effects
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

  public ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }


  public setCategory(category: string) {
    this.category$.next(category)
  }

  private getChange(ch: SimpleChanges, key: keyof StatusEffectsTableComponent) {
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
        api.getSelectedRows().map((it) => field(it, 'StatusID'))
      )
    ) {
      return
    }
    api.forEachNode((it) => {
      if (toSelect && toSelect.includes(field(it.data, 'StatusID'))) {
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
