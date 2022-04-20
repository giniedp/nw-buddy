import { Component, OnInit, ChangeDetectionStrategy, OnChanges, OnDestroy, ViewChild, Input, Output, EventEmitter, ChangeDetectorRef, NgZone, SimpleChanges } from '@angular/core'
import { Perks } from '@nw-data/types'
import { isEqual } from 'lodash'
import { BehaviorSubject, combineLatest, defer, filter, map, Subject, takeUntil } from 'rxjs'
import { AgGridComponent } from '~/ui/ag-grid'
import { LocaleService } from '~/core/i18n'
import { NwService } from '~/core/nw'

function fieldName(key: keyof Perks) {
  return key
}

function field(item: any, key: keyof Perks) {
  return item[key]
}


@Component({
  selector: 'nwb-perks-table',
  templateUrl: './perks-table.component.html',
  styleUrls: ['./perks-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerksTableComponent implements OnInit, OnChanges, OnDestroy {

  @ViewChild(AgGridComponent, { static: true })
  public grid: AgGridComponent

  public get gridData() {
    return this.displayData
  }

  public gridOptions = this.nw.gridOptions({
    rowSelection: 'single',
    onSelectionChanged: (it) => {
      const ids = it.api.getSelectedRows().map((it) => field(it, 'PerkID'))
      this.zone.run(() => this.selectionChange.next(ids))
    },
    onRowDataChanged: () => {
      if (this.selection) {
        // this.select(this.selection, {
        //   ensureVisible: true
        // })
      }
    },
    columnDefs: [
      {
        sortable: false,
        filter: false,
        width: 74,
        cellRenderer: ({ data }) => {
          const rarity = this.nw.itemRarity(data)
          const iconPath = this.nw.iconPath(field(data, 'IconPath'))
          const icon = this.nw.renderIcon(iconPath, {
            size: 38,
            rarity: rarity,
          })
          return `<a href="${this.nw.nwdbLinkUrl('perk', field(data, 'PerkID'))}" target="_blank">${icon}</a>`
        },
      },
      {
        headerName: 'Name',
        valueGetter: ({ data }) => {
          const name = field(data, 'DisplayName')
          if (name) {
            return this.nw.translate(name)
          }
          const suffix = field(data, 'AppliedSuffix')
          if (suffix) {
            return `${field(data, 'ExclusiveLabels')}: ${this.nw.translate(suffix)}`
          }
          return ''
        },
        width: 300,
      },
      {
        headerName: 'Type',
        field: fieldName('PerkType'),
        width: 100,
      },
      {
        headerName: 'Prefix',
        valueGetter: ({ data }) => this.nw.translate(field(data, 'AppliedPrefix')),
        width: 150,
      },
      {
        headerName: 'Suffix',
        valueGetter: ({ data }) => this.nw.translate(field(data, 'AppliedSuffix')),
        width: 150,
      },
      {
        field: fieldName('PerkID'),
        hide: true,
      },
      {
        field: fieldName('Tier'),
        width: 100,
      },
      {
        field: fieldName('ItemClass'),
      },

      {
        field: fieldName('ExclusiveLabels'),
      },
      {
        field: fieldName('ExcludeItemClass'),
      },
    ],
  })

  @Input()
  public selection: string[]

  @Output()
  public selectionChange = new EventEmitter<string[]>()

  @Input()
  public filter: (item: Perks) => boolean

  public category = defer(() => this.category$)
  public categories = defer(() => this.categorie$)

  private data: Perks[]
  private displayData: Perks[]

  private category$ = new BehaviorSubject<string>(null)
  private categorie$ = new BehaviorSubject<string[]>(null)
  private destroy$ = new Subject()

  public constructor(
    private locale: LocaleService,
    private nw: NwService,
    private cdRef: ChangeDetectorRef,
    private zone: NgZone
  ) {
    //
  }

  public ngOnInit(): void {
    const data$ = this.nw.db.perks.pipe(map((items) => (this.filter ? items.filter(this.filter) : items)))

    data$
      .pipe(map((items) => Array.from(new Set(items.map((it) => it.PerkType).filter((it) => !!it)))))
      .pipe(takeUntil(this.destroy$))
      .subscribe((cats) => this.categorie$.next(cats))

    combineLatest({
      perks: data$,
      category: this.category$,
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe(({ perks, category }) => {
      this.data = perks
      this.displayData = category ? perks.filter((it) => it.PerkType === category) : perks
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

  private getChange(ch: SimpleChanges, key: keyof PerksTableComponent) {
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
        api.getSelectedRows().map((it) => field(it, 'PerkID'))
      )
    ) {
      return
    }
    api.forEachNode((it) => {
      if (toSelect && toSelect.includes(field(it.data, 'PerkID'))) {
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
