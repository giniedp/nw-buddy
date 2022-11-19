import { Dialog } from '@angular/cdk/dialog'
import { Inject, Injectable, NgZone, Optional } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { GridOptions, RowDataTransaction } from 'ag-grid-community'
import { debounceTime, defer, filter, merge, Observable, of, Subject, switchMap, take, takeUntil, tap } from 'rxjs'
import { SkillBuildRow, SkillBuildsStore } from '~/data'
import { TranslateService } from '~/i18n'
import { nwdbLinkUrl } from '~/nw'
import { getAbilityCategoryTag } from '~/nw/utils'
import { CellRendererService, DataTableAdapter, DataTableAdapterOptions, DataTableCategory, dataTableProvider } from '~/ui/data-table'
import { svgPen, svgTrashCan } from '~/ui/icons/svg'
import { ConfirmDialogComponent } from '~/ui/modal'
import { humanize } from '~/utils'

export interface SkillBuildsTableAdapterOptions extends DataTableAdapterOptions<SkillBuildRow> {
  noActions: boolean
}

@Injectable()
export class SkillBuildsTableAdapter extends DataTableAdapter<SkillBuildRow> {

  public static provider(options?: SkillBuildsTableAdapterOptions) {
    return dataTableProvider({
      adapter: SkillBuildsTableAdapter,
      options: options,
    })
  }

  public entityID(item: SkillBuildRow): string {
    return item.record.id
  }

  public entityCategory(item: SkillBuildRow): string | DataTableCategory | (string | DataTableCategory)[] {
    return null
  }

  public options = defer(() =>
    of<GridOptions<SkillBuildRow>>({
      getRowId: ({ data }) => this.entityID(data),
      rowSelection: 'single',
      rowBuffer: 0,
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
        this.colDef({
          colId: 'weapon',
          headerValueGetter: () => 'Weapon',
          pinned: false,
          sortable: true,
          filter: true,
          width: 100,
          valueGetter: this.valueGetter(({ data }) => humanize(data.record.weapon)),
          getQuickFilterText: ({ value }) => value,
        }),
        this.colDef({
          colId: 'skills',
          headerValueGetter: () => 'Skills',
          pinned: false,
          sortable: true,
          filter: true,
          width: 250,
          cellRenderer: this.cellRenderer(({ data }) => {

            return this.r.element('div.flex.flex-row.gap-1', {}, data.abilities?.map((it) => {

              return this.r.link({
                class: 'border border-1 transition-all translate-x-0 hover:translate-x-1',
                href: nwdbLinkUrl('ability', it.AbilityID),
                target: '_blank'
              }, [
                this.r.icon({
                  class: ['nw-icon', `bg-ability-${getAbilityCategoryTag(it)}`],
                  src: it.Icon
                })
              ])
            }))

          })
          //valueGetter: this.valueGetter(({ data }) => data.record.),
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

  public entities: Observable<SkillBuildRow[]> = defer(() => this.config?.source || this.store.rows$)
    .pipe(filter((it) => it != null))
    .pipe(take(1))

  public override transaction: Observable<RowDataTransaction<SkillBuildRow>> = defer(() => {
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
    private config: SkillBuildsTableAdapterOptions,
    private store: SkillBuildsStore,
    private dialog: Dialog,
    private i18n: TranslateService,
    private zone: NgZone,
    private r: CellRendererService
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
