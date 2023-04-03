import { Directive, ElementRef, Inject, OnDestroy, OnInit } from '@angular/core'
import { Subject, takeUntil } from 'rxjs'
import { ResizeObserverService } from './resize-observer'
import { DOCUMENT } from '@angular/common'

@Directive({
  standalone: true,
  selector: '[nwbEmbedHeight]'
})
export class EmbedHeightDirective implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>()

  public constructor(
    private elRef: ElementRef<HTMLElement>,
    private resize: ResizeObserverService,
    @Inject(DOCUMENT)
    private document: Document
  ) {}

  public ngOnInit(): void {
    this.resize
      .observe(this.elRef.nativeElement)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const parent = this.document?.defaultView?.parent
        parent?.postMessage(
          {
            type: 'nw-buddy-resize',
            height: res.height,
          },
          '*'
        )
      })
  }

  public ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
