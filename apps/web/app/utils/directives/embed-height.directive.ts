import { DOCUMENT } from '@angular/common'
import { Directive, ElementRef, forwardRef, Inject, Optional, SkipSelf } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ResizeObserverService } from '../services/resize-observer.service'

@Directive({
  standalone: true,
  selector: '[nwbEmbedHeight]',
})
export class EmbedHeightDirective {
  public constructor(
    elRef: ElementRef<HTMLElement>,
    resize: ResizeObserverService,
    @Inject(DOCUMENT)
    document: Document,
    @Inject(forwardRef(() => EmbedHeightDirective))
    @Optional()
    @SkipSelf()
    parent: EmbedHeightDirective,
  ) {
    if (parent) {
      return
    }
    resize
      .observe(elRef.nativeElement)
      .pipe(takeUntilDestroyed())
      .subscribe((res) => {
        const parent = document?.defaultView?.parent
        const height = Math.ceil(res.height)
        parent?.postMessage(
          {
            type: 'nw-buddy-resize',
            height: height,
          },
          '*',
        )
      })
  }
}
