import { Directive, ElementRef, EventEmitter, OnChanges, OnDestroy, OnInit, Output } from '@angular/core'

import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'

import { ResizeObserverRect, ResizeObserverService } from './resize-observer.service'

@Directive({
  selector: '[nwbResize]',
})
export class ResizeDirective implements OnChanges, OnInit, OnDestroy {
  @Output('nwbResize')
  public resize = new EventEmitter<ResizeObserverRect>()

  private destroy$ = new Subject<void>()

  constructor(private elRef: ElementRef<HTMLElement>, private service: ResizeObserverService) {}

  public ngOnChanges() {
    //
  }

  public ngOnInit() {
    this.service
      .observe(this.elRef.nativeElement)
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => this.resize.emit(value))
  }

  public ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
