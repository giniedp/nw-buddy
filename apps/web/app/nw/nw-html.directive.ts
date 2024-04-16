import { Directive, ElementRef, Input, inject } from '@angular/core'
import { sanitizeHtml } from './sanitize-html'

@Directive({
  standalone: true,
  selector: '[nwHtml]',
})
export class NwHtmlDirective {
  private elRef = inject(ElementRef<HTMLElement>)

  @Input()
  public set nwHtml(value: string) {
    this.elRef.nativeElement.innerHTML = sanitizeHtml(value)
  }
}
