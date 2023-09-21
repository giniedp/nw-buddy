import { CdkVirtualScrollableElement, ScrollingModule } from '@angular/cdk/scrolling'
import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ElementRef,
  Input,
  Type,
} from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { combineLatest, map, takeUntil } from 'rxjs'
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
  template: `
    <ng-content select="header"></ng-content>
    <cdk-virtual-scroll-viewport [itemSize]="itemSize$()" class="overflow-hidden">
      <div
        class="grid"
        [ngClass]="gridClass"
        [style.--nwb-vg-cols]="colCount$()"
        [style.--nwb-vg-rows]="rowCount$()"
        [style.--nwb-vg-height.px]="itemSize$()"
      >
        <ng-container *cdkVirtualFor="let row of rows$()">
          <ng-container
            [ngTemplateOutlet]="customRow?.template || tplRow"
            [ngTemplateOutletContext]="row"
          ></ng-container>
        </ng-container>
      </div>
    </cdk-virtual-scroll-viewport>
    <ng-content select="footer"></ng-content>

    <ng-template [nwbVirtualGridRow] let-row #tplRow>
      <ng-container *ngFor="let cell of row; trackBy: trackBy">
        <ng-container
          [ngTemplateOutlet]="customCell?.template || tplCell"
          [ngTemplateOutletContext]="cell"
        ></ng-container>
      </ng-container>
    </ng-template>

    <ng-template [nwbVirtualGridCell] let-data #tplCell>
      <ng-container *ngIf="!data && componentEmpty">
        <ng-container [ngComponentOutlet]="componentEmpty"></ng-container>
      </ng-container>
      <ng-container *ngIf="data || !componentEmpty">
        <ng-container [ngComponentOutlet]="component" [ngComponentOutletInputs]="{ data: data }"></ng-container>
      </ng-container>
    </ng-template>
  `,
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
  public gridClass: string[]

  @Input()
  public componentEmpty: Type<any>

  @Input()
  public component: Type<VirtualGridCellComponent<T>>

  @ContentChild(VirtualGridRowDirective, { static: true })
  protected customRow: VirtualGridRowDirective<T>

  @ContentChild(VirtualGridCellDirective, { static: true })
  protected customCell: VirtualGridCellDirective<T>

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
  }
}
