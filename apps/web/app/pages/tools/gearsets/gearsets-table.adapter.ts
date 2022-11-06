import { Dialog } from '@angular/cdk/dialog'
import { Inject, Injectable, NgZone, Optional } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { GridOptions, RowDataTransaction } from 'ag-grid-community'
import { debounceTime, defer, filter, merge, Observable, of, Subject, switchMap, take, takeUntil } from 'rxjs'
import { GearsetRow, GearsetsStore } from '~/data'
import { TranslateService } from '~/i18n'
import { EQUIP_SLOTS, getItemIconPath } from '~/nw/utils'
import { DataTableAdapter, DataTableAdapterOptions, DataTableCategory, dataTableProvider } from '~/ui/data-table'
import { svgPen, svgTrashCan } from '~/ui/icons/svg'
import { ConfirmDialogComponent } from '~/ui/modal'

export interface GearsetsTableAdapterOptions extends DataTableAdapterOptions<GearsetRow> {
  noActions: boolean
}

@Injectable()
export class GearsetsTableAdapter extends DataTableAdapter<GearsetRow> {
  public static provider(options?: GearsetsTableAdapterOptions) {
    return dataTableProvider({
      adapter: GearsetsTableAdapter,
      options: options,
    })
  }

  public entityID(item: GearsetRow): string {
    return item.record.id
  }

  public entityCategory(item: GearsetRow): string | DataTableCategory | (string | DataTableCategory)[] {
    return null
  }

  public options = defer(() =>
    of<GridOptions<GearsetRow>>({
      getRowId: ({ data }) => this.entityID(data),
      rowSelection: 'single',
      rowBuffer: 0,
      onRowDoubleClicked: ({ data }) => {
        this.zone.run(() => {
          this.router.navigate([data.record.id], {
            relativeTo: this.route,
          })
        })
      },
      columnDefs: [
        this.colDef({
          colId: 'name',
          headerValueGetter: () => 'Name',
          pinned: true,
          sortable: true,
          filter: true,
          width: 250,
          valueGetter: this.valueGetter(({ data }) => data.record.name),
          getQuickFilterText: ({ value }) => value,
        }),
        // this.colDef({
        //   colId: 'weight',
        //   headerValueGetter: () => 'Weight',
        //   sortable: true,
        //   filter: true,
        //   width: 100,
        //   valueGetter: this.valueGetter(({ data }) => data.weight),
        //   valueFormatter: ({ value }) =>  getWeightLabel(value),
        //   getQuickFilterText: ({ value }) => value,
        // }),
        this.colDef({
          colId: 'gearScore',
          headerValueGetter: () => 'GS',
          sortable: true,
          filter: true,
          width: 100,
          valueGetter: this.valueGetter(({ data }) => data.gearScore),
          getQuickFilterText: ({ value }) => value,
        }),
        this.colDef({
          colId: 'slots',
          headerValueGetter: () => 'Slots',
          sortable: false,
          filter: false,
          autoHeight: true,
          width: 600,
          cellRenderer: this.cellRenderer(({ data }) => {
            return this.el(
              'div.flex.flex-row.flex-wrap.gap-1.items-center.h-full.overflow-hidden',
              {},
              EQUIP_SLOTS.map((slot) => {
                const sData = data.slots?.[slot.id]
                if (!sData?.item) {
                  return null
                }
                return this.createIcon((pic, img) => {
                  pic.classList.add('flex-none', 'nw-icon', 'w-12', 'h-12', `bg-rarity-${sData.rarity}`)
                  img.src = getItemIconPath(sData.item)
                  img.loading = 'lazy'
                })
              }).filter((it) => !!it)
            )
          }),
        }),
        this.config?.noActions
          ? null
          : this.colDef({
              colId: 'actions',
              headerValueGetter: () => 'Actions',
              sortable: false,
              filter: false,
              resizable: false,
              width: 120,
              cellRenderer: this.cellRenderer(({ data }) => {
                return this.el('div.btn-group.content-center', {}, [
                  this.el('button.btn.btn-ghost', {
                    html: `<span class="w-4 h-4">${svgPen}</span>`,
                    ev: {
                      onclick: (e) => {
                        e.stopImmediatePropagation()
                        this.zone.run(() => {
                          this.router.navigate([data.record.id], {
                            relativeTo: this.route,
                          })
                        })
                      },
                    },
                  }),
                  this.el('button.btn.btn-ghost', {
                    html: `<span class="w-4 h-4">${svgTrashCan}</span>`,
                    ev: {
                      onclick: (e) => {
                        e.stopImmediatePropagation()
                        this.zone.run(() => {
                          ConfirmDialogComponent.open(this.dialog, {
                            data: {
                              title: 'Delete Gearset',
                              body: 'Are you sure you want to delete this gearset?',
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
                  }),
                ])
              }),
            }),
      ].filter((it) => !!it),
    })
  )

  public entities: Observable<GearsetRow[]> = defer(() => this.config?.source || this.store.rows$)
    .pipe(filter((it) => it != null))
    .pipe(take(1))

  public override transaction: Observable<RowDataTransaction> = defer(() => {
    return merge(
      this.store.rowCreated$.pipe(switchMap((item) => this.txInsert([item]))),
      this.store.rowUpdated$.pipe(switchMap((item) => this.txUpdate([item]))),
      this.store.rowDestroyed$.pipe(switchMap((recordId) => this.txRemove([recordId])))
    )
  })

  private destroy$ = new Subject<void>()

  public constructor(
    @Optional()
    @Inject(DataTableAdapterOptions)
    private config: GearsetsTableAdapterOptions,
    private store: GearsetsStore,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: Dialog,
    private i18n: TranslateService,
    private zone: NgZone
  ) {
    super()
    this.attachListener()
  }

  public ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private attachListener() {
    this.store.rowCreated$
      .pipe(debounceTime(100))
      .pipe(takeUntil(this.destroy$))
      .subscribe((item) => {
        this.select.next([item.record.id])
      })
  }
}
