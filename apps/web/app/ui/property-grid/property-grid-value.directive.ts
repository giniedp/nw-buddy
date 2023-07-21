import { Directive, TemplateRef } from '@angular/core'
import { PropertyGridCell } from './property-grid-cell.directive'

export interface PropertyGridValueContext {
  $implicit: PropertyGridCell
}

@Directive({
  standalone: true,
  selector: '[nwbGridValue]',
  exportAs: 'gridValue'
})
export class PropertyGridValueDirective {

  public static ngTemplateContextGuard<T>(dir: PropertyGridValueDirective, ctx: unknown): ctx is PropertyGridValueContext {
    return true
  }

  public constructor(public readonly template: TemplateRef<PropertyGridValueContext>) {}
}
