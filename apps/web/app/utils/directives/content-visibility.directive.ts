import { Directive, ElementRef, NgZone, OnDestroy, Renderer2 } from '@angular/core'
import { isEqual } from 'lodash'

import { Subject } from 'rxjs'
import { distinctUntilChanged, filter, map, takeUntil } from 'rxjs/operators'
import { ResizeObserverService } from '../services/resize-observer.service'

@Directive({
  standalone: true,
  selector: '[nwbContentVisibility]',
})
export class ContentVisibilityDirective implements OnDestroy {
  private destroy$ = new Subject<void>()

  public constructor(
    private elRef: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private resize: ResizeObserverService,
    zone: NgZone,
  ) {
    zone.runOutsideAngular(() => {
      this.renderer.setStyle(this.elRef.nativeElement, 'contentVisibility', 'auto')
      this.resize
        .observe(this.elRef.nativeElement)
        .pipe(map((it) => it?.height))
        .pipe(filter((it) => it > 0))
        .pipe(distinctUntilChanged(isEqual))
        .pipe(takeUntil(this.destroy$))
        .subscribe((height) => {
          this.renderer.setStyle(this.elRef.nativeElement, 'containIntrinsicSize', `${height}px`)
        })
    })
  }

  public ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
