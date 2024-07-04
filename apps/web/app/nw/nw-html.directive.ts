import { Directive, ElementRef, Input, inject } from '@angular/core'
import { NwHtmlService } from './nw-html.service'

@Directive({
  standalone: true,
  selector: '[nwHtml]',
})
export class NwHtmlDirective {
  private elRef = inject(ElementRef<HTMLElement>)
  private html = inject(NwHtmlService)

  @Input()
  public set nwHtml(value: string) {
    this.elRef.nativeElement.innerHTML = this.html.sanitize(value)
  }
}
