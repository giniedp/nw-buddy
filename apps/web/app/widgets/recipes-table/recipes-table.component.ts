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
  NgZone,
  ChangeDetectorRef,
} from '@angular/core'
import { Ability, Crafting, ItemDefinitionMaster } from '@nw-data/types'
import { combineLatest, Subject, takeUntil } from 'rxjs'
import { AgGridComponent } from '~/ui/ag-grid'
import { NwService } from '~/core/nw'

function fieldName(key: keyof Crafting) {
  return key
}

function field<K extends keyof Crafting>(item: Crafting, key: K): Crafting[K] {
  return item[key]
}

@Component({
  selector: 'nwb-recipes-table',
  templateUrl: './recipes-table.component.html',
  styleUrls: ['./recipes-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipesTableComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild(AgGridComponent, { static: true })
  public grid: AgGridComponent

  public get data() {
    return this.recipes
  }

  public gridOptions = this.nw.gridOptions({
    rowSelection: 'single',
    onSelectionChanged: (it) => {
      const ids = it.api.getSelectedRows().map((it) => field(it, 'RecipeID'))
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
      // {
      //   sortable: false,
      //   filter: false,
      //   width: 74,
      //   cellRenderer: ({ data }) => {
      //     const rarity = this.nw.itemRarity(data)
      //     const iconPath = this.nw.iconPath(field(data, 'Icon') || data.IconPath)
      //     const icon = this.nw.renderIcon(iconPath, {
      //       size: 38,
      //       rarity: rarity,
      //     })
      //     return `<a href="${this.nw.nwdbLinkUrl('crafting', field(data, 'RecipeID'))}" target="_blank">${icon}</a>`
      //   },
      // },
      // {
      //   headerName: 'Name',
      //   valueGetter: ({ data }) => {
      //     return this.nw.translate(field(data, ''))
      //   },
      //   width: 300,
      // },
      // {
      //   field: fieldName('WeaponTag'),
      // },
      // {
      //   field: fieldName('AttackType'),
      // },
    ],
  })

  @Input()
  public selection: string[]

  @Output()
  public selectionChange = new EventEmitter<string[]>()

  private recipes: Crafting[]
  // private items: Map<string, ItemDefinitionMaster>

  private destroy$ = new Subject()

  public constructor(private nw: NwService, private zone: NgZone, private cdRef: ChangeDetectorRef) {}

  public ngOnInit(): void {
    combineLatest({
      recipes: this.nw.db.recipes,
      items: this.nw.db.itemsMap,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ recipes, items }) => {
        this.recipes = recipes
        // this.items = items
        this.cdRef.markForCheck()
      })
  }

  public ngOnChanges() {}

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
