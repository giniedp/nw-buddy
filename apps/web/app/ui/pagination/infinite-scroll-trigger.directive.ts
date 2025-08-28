import { Directive, ElementRef, HostListener, signal } from '@angular/core'
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import { combineLatest, distinctUntilChanged, EMPTY, filter, of, switchMap, take, tap } from 'rxjs'
import { IntersectionObserverService } from '~/utils'
import { InfiniteScrollDirective } from './infinite-scroll.directive'

@Directive({
  standalone: true,
  selector: '[nwbInfiniteScrollTrigger]',
})
export class InfiniteScrollTrigger<T> {
  private canLoad = this.parent.canLoad
  private isLoading = signal(false)

  public constructor(
    private parent: InfiniteScrollDirective<T>,
    private elRef: ElementRef<HTMLElement>,
    private intersection: IntersectionObserverService,
  ) {
    combineLatest({
      canLoad: toObservable(this.canLoad),
      isLoading: toObservable(this.isLoading),
    })
      .pipe(distinctUntilChanged())
      .pipe(
        switchMap(({ canLoad, isLoading }) => {
          const isReady = canLoad && !isLoading
          return isReady ? this.intersection.observe(this.elRef.nativeElement) : EMPTY
        }),
      )
      .pipe(filter((it) => it.isIntersecting))
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.next())
  }

  @HostListener('click', ['$event.target'])
  public async next() {
    if (this.isLoading()) {
      return
    }
    of(null)
      .pipe(switchMap(() => this.parent.pagination().next()))
      .pipe(take(1))
      .pipe(
        tap({
          subscribe: () => this.isLoading.set(true),
          complete: () => this.isLoading.set(false),
          error: () => this.isLoading.set(false),
        }),
      )
      .subscribe()
  }
}
