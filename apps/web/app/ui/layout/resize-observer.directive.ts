import { Directive, ElementRef, Input, NgZone, inject, signal } from '@angular/core'
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import { map } from 'rxjs'
import { ResizeObserverService } from '~/utils/services/resize-observer.service'

@Directive({
  standalone: true,
  selector: '[nwbSizeObserver]',
  exportAs: 'size',
})
export class SizeObserverDirective {
  @Input()
  public nwbSizeObserver: void
  public width = signal<number>(0)
  public height = signal<number>(0)
  public width$ = toObservable(this.width)
  public height$ = toObservable(this.height)

  public constructor(elRef: ElementRef<HTMLElement>, service: ResizeObserverService, zone: NgZone) {
    zone.runOutsideAngular(() => {
      service
        .observe(elRef.nativeElement)
        .pipe(takeUntilDestroyed())
        .subscribe((rect) => {
          this.width.set(rect.width)
          this.height.set(rect.height)
        })
    })
  }
}

export function injectElementWidth() {
  const elRef = inject(ElementRef)
  const service = inject(ResizeObserverService)
  return service
    .observe(elRef.nativeElement)
    .pipe(takeUntilDestroyed())
    .pipe(map((it) => it.width))
}
