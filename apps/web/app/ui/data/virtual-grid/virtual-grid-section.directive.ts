import { Directive, inject, Input, TemplateRef } from '@angular/core'

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

  public readonly template = inject<TemplateRef<VirtualGridSectionContext>>(TemplateRef)

  @Input()
  public nwbVirtualGridSection: void
}
