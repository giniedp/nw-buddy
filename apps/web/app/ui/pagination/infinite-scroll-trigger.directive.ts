import { Directive, ElementRef, HostListener, OnDestroy, OnInit } from '@angular/core'
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  EMPTY,
  filter,
  map,
  Subject,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs'
import { IntersectionObserverService } from '~/utils'
import { InfiniteScrollDirective } from './infinite-scroll.directive'

@Directive({
  standalone: true,
  selector: '[nwbInfiniteScrollTrigger]',
})
export class InfiniteScrollTrigger<T> implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>()

  private canLoad$ = this.parent.state$.pipe(map((state) => state.canLoad))
  private isLoading$ = new BehaviorSubject(false)

  public constructor(
    private parent: InfiniteScrollDirective<T>,
    private elRef: ElementRef<HTMLElement>,
    private intersection: IntersectionObserverService,
  ) {
    //
  }

  public ngOnInit() {
    combineLatest({
      canLoad: this.canLoad$,
      isLoading: this.isLoading$,
    })
      .pipe(distinctUntilChanged())
      .pipe(
        switchMap(({ canLoad, isLoading }) => {
          const isReady = canLoad && !isLoading
          return isReady ? this.intersection.observe(this.elRef.nativeElement) : EMPTY
        }),
      )
      .pipe(filter((it) => it.isIntersecting))
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.next())
  }

  public ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  @HostListener('click', ['$event.target'])
  public async next() {
    if (this.isLoading$.value) {
      return
    }
    this.parent.pagination$
      .pipe(switchMap((it) => it.next()))
      .pipe(take(1))
      .pipe(
        tap({
          subscribe: () => this.isLoading$.next(true),
          complete: () => this.isLoading$.next(false),
          error: () => this.isLoading$.next(false),
        }),
      )
      .subscribe()
  }
}
