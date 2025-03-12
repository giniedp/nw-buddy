import { Directive, Input, NgIterable, TemplateRef } from '@angular/core'
import { VirtualGridStore } from './virtual-grid.store'

export interface VirtualGridCellContext<T> {
  $implicit: T
  index: number
  count: number
  first: boolean
  last: boolean
  even: boolean
  odd: boolean
}

@Directive({
  standalone: true,
  selector: '[nwbVirtualGridCell]',
  exportAs: 'virtualCell',
})
export class VirtualGridCellDirective<T> {
  public static ngTemplateContextGuard<T>(
    dir: VirtualGridCellDirective<T>,
    ctx: unknown,
  ): ctx is VirtualGridCellContext<T> {
    return true
  }

  @Input()
  public set nwbVirtualGridCell(data: T[]) {
    this.store.patchState({ data: data })
  }

  public constructor(
    public readonly template: TemplateRef<VirtualGridCellContext<T>>,
    private store: VirtualGridStore<T>,
  ) {
    //
  }
}
