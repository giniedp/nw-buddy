import { Directive, ElementRef, Input, OnDestroy, OnInit } from '@angular/core'
import { ReplaySubject, Subject, takeUntil } from 'rxjs'
import Swiper from 'swiper'
import { SwiperOptions } from 'swiper/types/swiper-options'

@Directive({
  standalone: true,
  selector: '[nwbSwiper]',
  exportAs: 'nwbSwiper',
})
export class SwiperDirective implements OnInit, OnDestroy {
  @Input()
  public set nwbSwiper(options: SwiperOptions) {
    this.options$.next(options)
  }

  protected options$ = new ReplaySubject<SwiperOptions>(1)
  private destroy$ = new Subject<void>()
  private instance: Swiper

  public constructor(private elRef: ElementRef<HTMLElement>) {}

  public ngOnInit(): void {
    this.options$.pipe(takeUntil(this.destroy$)).subscribe((options) => {
      this.instance?.destroy()
      this.instance = new Swiper(this.elRef.nativeElement, options)
    })
  }

  public ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
    this.instance?.destroy()
  }

  public slideNext() {
    this.instance?.slideNext()
  }
  public slidePrev() {
    this.instance?.slidePrev()
  }
}
