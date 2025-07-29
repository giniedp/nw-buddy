import { CdkVirtualScrollViewport, CdkVirtualScrollableElement, ScrollingModule } from '@angular/cdk/scrolling'
import { CommonModule } from '@angular/common'
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Injector,
  Input,
  Output,
  Type,
  inject,
  viewChild,
} from '@angular/core'
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import { asyncScheduler, combineLatest, debounceTime, filter, map, skip, subscribeOn } from 'rxjs'
import { NwModule } from '~/nw'
import { ResizeObserverService } from '~/utils/services/resize-observer.service'
import { VirtualGridCellComponent } from './virtual-grid-cell.component'
import { VirtualGridCellDirective } from './virtual-grid-cell.directive'
import { VirtualGridOptions } from './virtual-grid-options'
import { VirtualGridRowContext, VirtualGridRowDirective } from './virtual-grid-row.directive'
import { VirtualGridSectionComponent } from './virtual-grid-section.component'
import { VirtualGridSectionDirective } from './virtual-grid-section.directive'
import { VirtualGridStore } from './virtual-grid.store'

@Component({
  selector: 'nwb-virtual-grid',
  styleUrls: ['./virtual-grid.component.scss'],
  templateUrl: './virtual-grid.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ScrollingModule, VirtualGridCellDirective, VirtualGridRowDirective],
  hostDirectives: [CdkVirtualScrollableElement],
  providers: [VirtualGridStore],
  host: {
    class: 'block flex-1 w-full h-full relative',
  },
})
export class VirtualGridComponent<T> implements AfterViewInit {
  @Input()
  public set options(options: VirtualGridOptions<T>) {
    this.gridClass = options.gridClass ?? this.gridClass
    this.component = options.cellDataView ?? this.component
    this.componentEmpty = options.cellEmptyView ?? this.componentEmpty
    this.sectionComponent = options.sectionRowView ?? this.sectionComponent
    this.store.patchState({
      itemHeight: options.height,
      itemWidth: options.width,
      colCount: options.cols,
      ngClass: options.gridClass,
      getItemSection: options.getSection,
      quickfilterGetter: options.getQuickFilterText,
      withSectionRows: !!options.sectionRowView,
    })
  }

  @Input()
  public set identifyBy(fn: (it: T) => string | number) {
    this.store.patchState({
      identifyBy: fn,
    })
  }

  @Input()
  public set itemHeight(value: number) {
    this.store.patchState({
      itemHeight: value,
    })
  }

  @Input()
  public set itemWidth(value: number | [number, number]) {
    this.store.patchState({
      itemWidth: value,
    })
  }

  @Input()
  public set columns(value: number | [number, number]) {
    this.store.patchState({
      colCount: value,
    })
  }

  @Input()
  public set data(value: T[]) {
    this.store.patchState({
      data: value,
    })
  }

  @Input()
  public set selection(value: Array<string | number>) {
    this.store.patchState({
      selection: value,
    })
  }
  @Input()
  public set sectionFn(value: (it: T) => string) {
    this.store.patchState({
      getItemSection: value,
    })
  }

  @Input()
  public gridClass: string[]

  @Input()
  public componentEmpty: Type<any>

  @Input()
  public component: Type<VirtualGridCellComponent<T>>

  @Input()
  public sectionComponent: Type<VirtualGridSectionComponent>

  @Output()
  public cellDoubleClicked = new EventEmitter<T>()

  @Output()
  public cellClicked = new EventEmitter<T>()

  @ContentChild(VirtualGridRowDirective, { static: true })
  protected customRow: VirtualGridRowDirective<T>

  @ContentChild(VirtualGridCellDirective, { static: true })
  protected customCell: VirtualGridCellDirective<T>

  @ContentChild(VirtualGridSectionDirective, { static: true })
  protected customSection: VirtualGridSectionDirective

  protected viewport = viewChild(CdkVirtualScrollViewport)
  protected viewport$ = toObservable(this.viewport)

  @Output()
  public selection$ = this.store.selection$.pipe(skip(1))

  protected rows = this.store.rows
  protected colCount = this.store.colCount
  protected rowCount = this.store.rowCount
  protected itemSize = this.store.itemSize

  protected trackRowBy = (i: number, row: VirtualGridRowContext<T>) => {
    if (!this.store.identifyBy()) {
      return i
    }
    if (row.$implicit.type === 'items') {
      return row.$implicit.items.map((it) => this.store.identifyBy()(it.$implicit)).join(',')
    }

    return i
  }
  protected trackCellBy = (i: number, cell: T) => {
    if (this.store.identifyBy()) {
      return this.store.identifyBy()(cell)
    }
    return i
  }

  private destroyRef = inject(DestroyRef)
  private injector = inject(Injector)

  public constructor(
    elRef: ElementRef<HTMLElement>,
    resize: ResizeObserverService,

    protected store: VirtualGridStore<T>,
  ) {
    const size$ = resize.observe(elRef.nativeElement).pipe(map((entries) => entries.width))
    this.store.withSize(size$)
    combineLatest({
      size: size$,
      viewport: this.viewport$,
    })
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.viewport()?.checkViewportSize()
      })
  }

  public ngAfterViewInit(): void {
    combineLatest({
      viewport: this.viewport$.pipe(filter((it) => it != null)),
      rows: toObservable(this.rows, {
        injector: this.injector,
      }).pipe(filter((rows) => rows?.length > 0)),
      selection: this.store.selection$.pipe(filter((it) => it != null)),
    })
      .pipe(
        map(({ selection }) => selection[0]),
        subscribeOn(asyncScheduler),
        debounceTime(500), // TODO: fix this
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((selection) => {
        this.scrollToItem(selection)
      })
  }

  public handleItemEvent(item: T, e: Event) {
    const identifyBy = this.store.identifyBy()

    const itemId = identifyBy?.(item)
    const selection = this.store.selection()
    const isSelected = selection.includes(itemId)
    switch (e.type) {
      case 'click': {
        if (!isSelected) {
          this.store.patchState({ selection: [itemId].filter((it) => it != null) })
        } else if ((e as MouseEvent).shiftKey) {
          this.store.patchState({ selection: [] })
        }
        this.cellClicked.emit(item)
        break
      }
      case 'dblclick': {
        if (!isSelected) {
          this.store.patchState({ selection: [itemId].filter((it) => it != null) })
        }
        this.cellDoubleClicked.emit(item)
        break
      }
      case 'keydown': {
        if ((e as KeyboardEvent).code === 'Space') {
          e.preventDefault()
          if (selection.includes(itemId)) {
            this.store.patchState({ selection: [] })
          } else {
            this.store.patchState({ selection: [itemId].filter((it) => it != null) })
          }
        }
        if ((e as KeyboardEvent).code === 'Space') {
          e.preventDefault()
          if (selection.includes(itemId)) {
            this.store.patchState({ selection: [] })
          } else {
            this.store.patchState({ selection: [itemId].filter((it) => it != null) })
          }
        }
      }
    }
  }

  public isSelected = (it: T) => {
    return this.store.selection$.pipe(
      map((selection) => {
        const identify = this.store.identifyBy()
        if (!identify) {
          return false
        }
        const id = identify(it)
        return selection?.includes(id)
      }),
    )
  }

  public scrollToItem(id: string | number) {
    const viewport = this.viewport()
    if (id == null || !viewport) {
      return
    }
    viewport.checkViewportSize()

    const identify = this.store.identifyBy()
    const rows = this.rows()
    const index = rows.findIndex((row) => {
      if (!(row.$implicit && 'items' in row.$implicit)) {
        return false
      }
      for (const it of row.$implicit.items) {
        if (!!it.$implicit && String(identify(it.$implicit)) === String(id)) {
          return true
        }
      }
      return false
    })
    if (index < 0) {
      return
    }

    const range = viewport.getRenderedRange()
    if (index >= range.start && index < range.end) {
      return
    }
    const centerIndex = Math.max(0, index - Math.floor((range.end - range.start) / 2))
    viewport.scrollToIndex(centerIndex, 'instant')
  }
}
