import { Directive, Injector, InputSignal, ModelSignal, TemplateRef, Type } from '@angular/core'
import { NwLinkResource } from '~/nw'

// export interface ObjectTreeLabel<C = unknown> {
//   value: string
//   injector?: Injector
//   template?: TemplateRef<ObjectTreeLabelContext>
// }

export interface ObjectTreeLabelContext {
  $implicit: any
}

@Directive({
  standalone: true,
  selector: '[nwbObjectTreeLabel]',
  exportAs: 'treeLabel',
})
export class ObjectTreeLabelDirective {
  public static ngTemplateContextGuard<T>(
    dir: ObjectTreeLabelDirective,
    ctx: unknown,
  ): ctx is ObjectTreeLabelContext {
    return true
  }

  public constructor(public readonly template: TemplateRef<ObjectTreeLabelContext>) {}
}
