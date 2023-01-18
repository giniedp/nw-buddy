import { Directive, TemplateRef } from '@angular/core'

export interface PropertyGridCell {
  value: string
  routerLink?: string | any[]
  externLink?: string
  primary?: boolean
  secondary?: boolean
  info?: boolean
  accent?: boolean
  bold?: boolean
  italic?: boolean
}

export interface PropertyGridCellContext {
  $implicit: PropertyGridCell[]
  cell: PropertyGridCell
  cells: PropertyGridCell[]
}

@Directive({
  standalone: true,
  selector: '[nwbPropertyGridCell]',
})
export class PropertyGridCellDirective {

  public static ngTemplateContextGuard<T>(dir: PropertyGridCellDirective, ctx: unknown): ctx is PropertyGridCellContext {
    return true
  }

  public constructor(public readonly template: TemplateRef<PropertyGridCellContext>) {}
}
