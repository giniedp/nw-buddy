import { Directive, Injector, InputSignal, ModelSignal, TemplateRef, Type } from '@angular/core'
import { NwLinkResource } from '~/nw'

export type ComponentInputs<C> = Partial<{
  [P in keyof C]: C[P] extends InputSignal<infer T> ? T : C[P] extends ModelSignal<infer T> ? T : never
}>

export interface PropertyGridCell<C = unknown> {
  value: string
  injector?: Injector
  component?: Type<C>
  componentInputs?: ComponentInputs<C>
  template?: TemplateRef<PropertyGridCellContext>
}

export interface PropertyGridCellContext {
  $implicit: string
}

@Directive({
  standalone: true,
  selector: '[nwbGridCell]',
  exportAs: 'gridCell',
})
export class PropertyGridCellDirective {
  public static ngTemplateContextGuard<T>(
    dir: PropertyGridCellDirective,
    ctx: unknown,
  ): ctx is PropertyGridCellContext {
    return true
  }

  public constructor(public readonly template: TemplateRef<PropertyGridCellContext>) {}
}
