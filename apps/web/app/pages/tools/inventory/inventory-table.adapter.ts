import { Dialog } from '@angular/cdk/dialog'
import { Inject, Injectable, NgZone, OnDestroy, Optional } from '@angular/core'
import { GridOptions, RowDataTransaction } from 'ag-grid-community'
import { uniqBy } from 'lodash'
import { debounceTime, defer, EMPTY, filter, merge, Observable, of, Subject, switchMap, take, takeUntil } from 'rxjs'
import { ItemInstanceRow, ItemInstancesStore } from '~/data'
import { TranslateService } from '~/i18n'
import { NwLinkService } from '~/nw'
import { EQUIP_SLOTS, getItemIconPath, getItemId, getItemRarityLabel, getItemTierAsRoman, isItemNamed } from '~/nw/utils'
import { RangeFilter, SelectFilter } from '~/ui/ag-grid'
import { DataTableAdapter, DataTableAdapterOptions, DataTableCategory, dataTableProvider } from '~/ui/data-table'
import { svgTrashCan } from '~/ui/icons/svg'
import { ConfirmDialogComponent } from '~/ui/layout'
import { humanize } from '~/utils'
import { DnDService } from '~/utils/dnd.service'

@Injectable()
export class InventoryTableAdapterConfig extends DataTableAdapterOptions<ItemInstanceRow> {}

@Injectable()
export class PlayerItemsTableAdapter extends DataTableAdapter<ItemInstanceRow> implements OnDestroy {
  public static provider(config?: InventoryTableAdapterConfig) {
    return dataTableProvider({
      adapter: PlayerItemsTableAdapter,
      options: config,
    })
  }

  public entityID(item: ItemInstanceRow): string {
    return item.record.id
  }
  public entityCategory(item: ItemInstanceRow): string[] {
    return item.item.ItemClass
  }
  public options = defer(() =>
    of<GridOptions<ItemInstanceRow>>({
      getRowId: ({ data }) => this.entityID(data),
      rowSelection: 'single',
      rowBuffer: 0,
      columnDefs: [
        this.colDef({
          colId: 'icon',
          headerValueGetter: () => 'Icon',
          resizable: false,
          sortable: false,
          filter: false,
          pinned: true,
          width: 100,
          minWidth: 100,
          maxWidth: 100,
          dndSource: true,
          dndSourceOnRowDrag: (params) => {
            const data = params.rowNode.data as ItemInstanceRow
            const json = JSON.stringify(data)
            params.dragEvent.dataTransfer.setData('application/json', json)
            this.dnd.data = data
          },
          cellRenderer: this.cellRenderer(({ data }) => {
            return this.createLinkWithIcon({
              href: this.info.link('item', getItemId(data.item)),
              target: '_blank',
              icon: getItemIconPath(data.item),
              rarity: data.rarity,
              named: isItemNamed(data.item),
              iconClass: ['transition-all', 'translate-x-0', 'hover:translate-x-1'],
            })
          }),
        }),
        this.colDef({
          colId: 'name',
          headerValueGetter: () => 'Name',
          sortable: true,
          filter: true,
          width: 250,
          valueGetter: this.valueGetter(({ data }) => this.i18n.get(data.item.Name)),
          cellRenderer: this.cellRenderer(({ value }) => this.makeLineBreaks(value)),
          cellClass: ['multiline-cell', 'py-2'],
          autoHeight: true,
          getQuickFilterText: ({ value }) => value,
        }),
        this.colDef({
          colId: 'perks',
          width: 150,
          sortable: false,
          headerValueGetter: () => 'Perks',
          valueGetter: this.valueGetter(({ data }) => data.perks?.map((it) => it?.perk?.PerkID)),
          cellRenderer: this.cellRenderer(({ data }) => {
            const perks = data.perks || []
            if (!perks.length) {
              return null
            }
            return this.el(
              'div.flex.flex-row.items-center.h-full',
              {},
              perks.map((it) => {
                if (!it?.perk) {
                  return this.createIcon((pic, img) => {
                    img.classList.add('w-7', 'h-7', 'nw-icon')
                    img.src = 'assets/icons/crafting_perkbackground.png'
                  })
                }
                return this.el(
                  'a.block.w-7.h-7',
                  {
                    attrs: {
                      target: '_blank',
                      href: this.info.link('perk', it?.perk?.PerkID),
                    },
                  },
                  [
                    this.createIcon((pic, img) => {
                      img.classList.add('w-7', 'h-7', 'nw-icon')
                      img.src = it?.perk?.IconPath
                    }),
                  ]
                )
              })
            )
          }),
          filter: SelectFilter,
          filterParams: SelectFilter.params({
            showSearch: true,
            optionsGetter: (node) => {
              const perks = (node.data as ItemInstanceRow).perks || []
              return perks
                .filter((it) => !!it?.perk)
                .map(({ perk }) => {
                  return {
                    id: perk.PerkID,
                    label: this.i18n.get(perk.DisplayName || perk.AppliedSuffix || perk.AppliedPrefix),
                    icon: perk.IconPath,
                  }
                })
            },
          }),
        }),
        this.colDef({
          colId: 'rarity',
          headerValueGetter: () => 'Rarity',
          valueGetter: this.valueGetter(({ data }) => String(data.rarity)),
          valueFormatter: ({ value }) => this.i18n.get(getItemRarityLabel(value)),
          filter: SelectFilter,
          width: 80,
          getQuickFilterText: ({ value }) => value,
        }),
        this.colDef({
          colId: 'tier',
          headerValueGetter: () => 'Tier',
          width: 60,
          valueGetter: this.valueGetter(({ data }) => getItemTierAsRoman(data.item.Tier)),
          filter: SelectFilter,
        }),

        this.colDef({
          colId: 'gearScore',
          headerValueGetter: () => 'GS',
          width: 60,
          cellClass: 'text-right',
          comparator: (a, b) => a[1] - b[1],
          valueGetter: this.valueGetter(({ data }) => {
            return [data.record.gearScore, data.record.gearScore]
          }),
          valueFormatter: ({ value }) => {
            if (value[0] === value[1]) {
              return String(value[0])
            }
            return `${value[0]}-${value[1]}`
          },
          filter: RangeFilter,
        }),
        this.colDef({
          colId: 'itemType',
          headerValueGetter: () => 'Item Type',
          valueGetter: this.valueGetter(({ data }) => data.item.ItemType),
          width: 100,
          filter: SelectFilter,
          getQuickFilterText: ({ value }) => value,
        }),
        this.colDef({
          colId: 'itemClass',
          headerValueGetter: () => 'Item Class',
          width: 250,
          valueGetter: this.valueGetter(({ data }) => data.item.ItemClass),
          cellRenderer: this.cellRendererTags(humanize),
          filter: SelectFilter,
          filterParams: SelectFilter.params({}),
        }),
        this.colDef({
          colId: 'actions',
          headerValueGetter: () => 'Actions',
          cellClass: 'text-center',
          width: 100,
          rowDragText: ({}) => 'Text',
          cellRenderer: this.cellRenderer(({ data }) => {
            return this.el('div.btn-group.content-center', {}, [
              this.el(
                'button.btn.btn-ghost',
                {
                  ev: {
                    onclick: (e) => {
                      e.stopImmediatePropagation()
                      this.zone.run(() => {
                        ConfirmDialogComponent.open(this.dialog, {
                          data: {
                            title: 'Delete Item',
                            body: 'Are you sure you want to delete this item? Gearsets linking to this item will loose the reference.',
                            positive: 'Delete',
                            negative: 'Cancel',
                          },
                        })
                          .closed.pipe(take(1))
                          .pipe(filter((it) => !!it))
                          .subscribe(() => {
                            this.store.destroyRecord({ recordId: data.record.id })
                          })
                      })
                    },
                  },
                },
                [this.el('span.w-4.h-4', { html: svgTrashCan })]
              ),
            ])
          }),
        }),
      ],
    })
  )

  public readonly entities: Observable<ItemInstanceRow[]> = defer(() => this.config?.source || this.store.rows$)
    .pipe(filter((it) => it != null))
    .pipe(take(1))

  public override categories: Observable<DataTableCategory[]> = defer(() => {
    const result = EQUIP_SLOTS.map(
      (it): DataTableCategory => ({
        icon: it.iconSlot || it.icon,
        value: it.itemType,
        label: it.name,
      })
    )
    return of(uniqBy(result, (it) => it.value))
  })

  public override transaction: Observable<RowDataTransaction> = defer(() => {
    if (!this.store) {
      return EMPTY
    }
    return merge(
      this.store.rowCreated$.pipe(switchMap((item) => this.txInsert([item]))),
      this.store.rowUpdated$.pipe(switchMap((item) => this.txUpdate([item]))),
      this.store.rowDestroyed$.pipe(switchMap((recordId) => this.txRemove([recordId])))
    )
  })

  private destroy$ = new Subject<void>()

  public constructor(
    @Optional()
    private store: ItemInstancesStore,
    private dnd: DnDService,
    private i18n: TranslateService,
    private dialog: Dialog,
    private zone: NgZone,
    @Inject(DataTableAdapterOptions)
    @Optional()
    private config: InventoryTableAdapterConfig,
    private info: NwLinkService
  ) {
    super()
    this.attachListener()
  }

  public ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private attachListener() {
    this.store?.rowCreated$
      .pipe(debounceTime(100))
      .pipe(takeUntil(this.destroy$))
      .subscribe((item) => {
        this.select.next([item.record.id])
      })
  }
}
