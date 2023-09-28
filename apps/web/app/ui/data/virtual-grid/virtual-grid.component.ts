import { CdkVirtualScrollViewport, CdkVirtualScrollableElement, ScrollingModule } from '@angular/cdk/scrolling'
import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  Type,
  ViewChild,
} from '@angular/core'
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop'
import { combineLatest, filter, map, skip, takeUntil } from 'rxjs'
import { NwModule } from '~/nw'
import { ResizeObserverService } from '~/utils/services/resize-observer.service'
import { VirtualGridCellComponent } from './virtual-grid-cell.component'
import { VirtualGridCellDirective } from './virtual-grid-cell.directive'
import { VirtualGridOptions } from './virtual-grid-options'
import { VirtualGridRowDirective } from './virtual-grid-row.directive'
import { VirtualGridStore } from './virtual-grid.store'

@Component({
  standalone: true,
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
export class VirtualGridComponent<T> {
  @Input()
  public set options(options: VirtualGridOptions<T>) {
    this.gridClass = options.gridClass
    this.component = options.cellDataView
    this.componentEmpty = options.cellEmptyView
    this.store.patchState({
      itemHeight: options.height,
      itemWidth: options.width,
      colCount: options.cols,
      ngClass: options.gridClass,
      quickfilterGetter: options.getQuickFilterText,
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
  public gridClass: string[]

  @Input()
  public componentEmpty: Type<any>

  @Input()
  public component: Type<VirtualGridCellComponent<T>>

  @Output()
  public cellDoubleClicked = new EventEmitter<T>()

  @Output()
  public cellClicked = new EventEmitter<T>()

  @ContentChild(VirtualGridRowDirective, { static: true })
  protected customRow: VirtualGridRowDirective<T>

  @ContentChild(VirtualGridCellDirective, { static: true })
  protected customCell: VirtualGridCellDirective<T>

  @ViewChild('viewport')
  protected viewport: CdkVirtualScrollViewport

  @Output()
  public selection$ = this.store.selection$.pipe(skip(1))

  protected rows$ = toSignal(this.store.rows$)
  protected colCount$ = toSignal(this.store.colCount$)
  protected rowCount$ = toSignal(this.store.rowCount$)
  protected itemSize$ = toSignal(this.store.itemSize$)

  protected trackBy = (i: number) => i

  public constructor(
    elRef: ElementRef<HTMLElement>,
    resize: ResizeObserverService,
    cdRef: ChangeDetectorRef,

    protected store: VirtualGridStore<T>
  ) {
    const size$ = resize.observe(elRef.nativeElement).pipe(
      map((entries) => {
        return entries.width
      })
    )
    this.store.patchState(combineLatest({ size: size$ }))
    this.store.rows$.pipe(takeUntil(this.store.destroy$)).subscribe(() => {
      cdRef.detectChanges()
    })
    combineLatest({
      rows: this.store.rows$.pipe(filter((it) => !!it.length)),
      selection: this.store.selection$.pipe(map((it) => it[0])),
    })
      .pipe(takeUntilDestroyed())
      .subscribe(({ selection }) => this.scrollToItem(selection))
  }

  public handleItemEvent(item: T, e: Event) {
    const identifyBy = this.store.identifyBy$()

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
        const identify = this.store.identifyBy$()
        if (!identify) {
          return false
        }
        const id = identify(it)
        return selection?.includes(id)
      })
    )
  }

  public scrollToItem(id: string | number) {
    if (id == null) {
      return
    }
    const identify = this.store.identifyBy$()
    const rows = this.rows$()
    const index = rows.findIndex((row) => {
      for (const it of row.$implicit) {
        if (!!it.$implicit && String(identify(it.$implicit)) === String(id)) {
          return true
        }
      }
      return false
    })
    if (index < 0) {
      return
    }
    const range = this.viewport.getRenderedRange()
    if (index >= range.start && index < range.end) {
      return
    }
    const centerIndex = Math.max(0, index - Math.floor((range.end - range.start) / 2))
    this.viewport.scrollToIndex(centerIndex, 'instant')
  }
}

function isSelectionEvent(e: Event) {
  if (e.type === 'click') {
    return true
  }
  if (e.type === 'keydown' && (e as KeyboardEvent).key === 'Space') {
    return true
  }
  return false
}
