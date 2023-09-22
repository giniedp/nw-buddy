import { Directive } from '@angular/core'

@Directive()
export abstract class VirtualGridCellComponent<T> {
  public abstract set data(value: T)
  public abstract set selected(value: boolean)
}
