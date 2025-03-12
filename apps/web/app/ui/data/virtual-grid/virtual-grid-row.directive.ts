import { Directive, Input, NgIterable, TemplateRef } from '@angular/core'
import { VirtualGridCellContext } from './virtual-grid-cell.directive'
import { VirtualGridStore } from './virtual-grid.store'
import { VirtualGridSectionContext } from './virtual-grid-section.directive'

export interface VirtualGridRowContext<T> {
  $implicit:
    | {
        type: 'section'
        section: VirtualGridSectionContext
      }
    | {
        type: 'items'
        items: Array<VirtualGridCellContext<T>>
      }
  index: number
  count: number
  first: boolean
  last: boolean
  even: boolean
  odd: boolean
}

@Directive({
  standalone: true,
  selector: '[nwbVirtualGridRow]',
  exportAs: 'virtualRow',
})
export class VirtualGridRowDirective<T> {
  public static ngTemplateContextGuard<T>(
    dir: VirtualGridRowDirective<T>,
    ctx: unknown,
  ): ctx is VirtualGridRowContext<T> {
    return true
  }

  @Input()
  public set nwbVirtualGridRow(data: T[]) {
    this.store.patchState({ data: data })
  }

  public constructor(
    public readonly template: TemplateRef<VirtualGridRowContext<T>>,
    private store: VirtualGridStore<T>,
  ) {
    //
  }
}
