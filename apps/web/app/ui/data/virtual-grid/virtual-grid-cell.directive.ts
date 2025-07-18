import { Directive, inject, Input, TemplateRef } from '@angular/core'
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
  public readonly template = inject<TemplateRef<VirtualGridCellContext<T>>>(TemplateRef)
  private store = inject<VirtualGridStore<T>>(VirtualGridStore)

  @Input()
  public set nwbVirtualGridCell(data: T[]) {
    this.store.patchState({ data: data })
  }
}
