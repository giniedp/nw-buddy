import { Directive, Input } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { BehaviorSubject, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs'
import { QuicksearchService } from '~/ui/quicksearch'
import { selectStream } from '~/utils'
import { VirtualGridStore } from '../virtual-grid.store'

@Directive({
  standalone: true,
  selector: 'nwb-virtual-grid[enableQuickfilter]',
})
export class VirtualGridQuickfilterDirective {
  @Input()
  public set enableQuickfilter(value: boolean) {
    this.enabled$.next(value)
  }

  private enabled$ = new BehaviorSubject<boolean>(false)

  public constructor(search: QuicksearchService, store: VirtualGridStore<unknown>) {
    this.enabled$
      .pipe(
        switchMap((enabled) => {
          if (!enabled) {
            return of('')
          }
          return selectStream(search.query$).pipe(debounceTime(500))
        }),
      )
      .pipe(distinctUntilChanged())
      .pipe(tap((query) => store.patchState({ quickfilter: query })))
      .pipe(takeUntilDestroyed())
      .subscribe()

    store.quickfilter$
      .pipe(distinctUntilChanged())
      .pipe(tap((text) => search.submit(text)))
      .pipe(takeUntilDestroyed())
      .subscribe()
  }
}
