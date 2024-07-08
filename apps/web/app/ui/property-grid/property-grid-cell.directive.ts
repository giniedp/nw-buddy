import { Directive, TemplateRef } from '@angular/core'
import { NwLinkResource } from '~/nw'

export interface PropertyGridCell {
  value: string
  template?: TemplateRef<PropertyGridCell>
  tooltip?: TemplateRef<PropertyGridCell>
  routerLink?: [NwLinkResource, string] | [NwLinkResource]
  queryParams?: Record<string, any>
  externLink?: string
  primary?: boolean
  secondary?: boolean
  info?: boolean
  accent?: boolean
  bold?: boolean
  italic?: boolean
  block?: boolean
}

export interface PropertyGridCellContext {
  $implicit: PropertyGridCell[]
}

@Directive({
  standalone: true,
  selector: '[nwbGridCell]',
  exportAs: 'gridCell'
})
export class PropertyGridCellDirective {

  public static ngTemplateContextGuard<T>(dir: PropertyGridCellDirective, ctx: unknown): ctx is PropertyGridCellContext {
    return true
  }

  public constructor(public readonly template: TemplateRef<PropertyGridCellContext>) {}
}
