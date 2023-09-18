import { Directive, ElementRef, Input } from '@angular/core'
import { environment } from 'apps/web/environments'
import { sanitizeHtml } from './sanitize-html'

@Directive({
  standalone: true,
  selector: '[nwHtml]',
})
export class NwHtmlDirective {
  @Input()
  public set nwHtml(value: string) {
    this.elRef.nativeElement.innerHTML = sanitizeHtml(value)
  }

  public constructor(private elRef: ElementRef<HTMLElement>) {
    //
  }
}
