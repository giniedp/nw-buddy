import { Directive, Input, TemplateRef } from '@angular/core'

export interface VirtualGridSectionContext {
  $implicit: string
}

@Directive({
  standalone: true,
  selector: '[nwbVirtualGridSection]',
  exportAs: 'virtualSection',
})
export class VirtualGridSectionDirective {
  public static ngTemplateContextGuard(
    dir: VirtualGridSectionDirective,
    ctx: unknown,
  ): ctx is VirtualGridSectionContext {
    return true
  }

  @Input()
  public nwbVirtualGridSection: void

  public constructor(public readonly template: TemplateRef<VirtualGridSectionContext>) {
    //
  }
}
