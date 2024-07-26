import { Directive, ElementRef, Input, Renderer2, computed, effect, inject, signal } from '@angular/core'
import { NwLinkResource } from './nw-link'
import { NwLinkService } from './nw-link.service'

export type NwLinkInput = [NwLinkResource, string | number]

@Directive({
  standalone: true,
  selector: '[nwLinkTooltip]',
})
export class NwLinkTooltipDirective {
  private elRef = inject(ElementRef)
  private renderer = inject(Renderer2)
  private service = inject(NwLinkService)
  private resource = signal<NwLinkResource>(null)
  private resourceId = signal<string>(null)
  private href = computed(() => this.service.tooltipLink(this.resource(), this.resourceId()))
  private target = computed(() => (!!this.href()?.startsWith('http') ? '_blank' : null))

  @Input()
  public set nwLinkTooltip(value: NwLinkInput) {
    if (!value || (value.length === 2 && !value[1])) {
      this.resource.set(null)
      this.resourceId.set(null)
    } else {
      this.resource.set(value[0])
      this.resourceId.set(String(value[1] || ''))
    }
  }

  public constructor() {
    effect(() => {
      if (this.href() && this.elRef.nativeElement.tagName === 'A') {
        this.renderer.setAttribute(this.elRef.nativeElement, 'href', this.href())
        this.renderer.setAttribute(this.elRef.nativeElement, 'target', this.target())
      } else {
        this.renderer.removeAttribute(this.elRef.nativeElement, 'href')
        this.renderer.removeAttribute(this.elRef.nativeElement, 'target')
      }
    })
  }
}
