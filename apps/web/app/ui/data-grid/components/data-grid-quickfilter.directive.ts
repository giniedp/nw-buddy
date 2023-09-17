import { Directive, Input } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ComponentStore } from '@ngrx/component-store'
import { combineLatest, debounceTime, distinctUntilChanged, filter, map, tap } from 'rxjs'
import { AgGrid, fromGridEvent } from '~/ui/ag-grid'
import { QuicksearchService } from '~/ui/quicksearch'
import { selectStream } from '~/utils'

@Directive({
  standalone: true,
  selector: '[nwbGridQuickfilter]',
})
export class DataGridQuickfilterDirective extends ComponentStore<{ grid: AgGrid }> {
  @Input()
  public set nwbGridQuickfilter(value: AgGrid) {
    this.patchState({ grid: value })
  }

  protected grid$ = this.select(({ grid }) => grid)

  public constructor(search: QuicksearchService) {
    super({ grid: null })
    combineLatest({
      query: selectStream(search.query$).pipe(debounceTime(500)),
      grid: this.grid$.pipe(filter((it) => !!it)),
    })
      .pipe(takeUntilDestroyed())
      .subscribe(({ query, grid }) => {
        grid.api.setQuickFilter(query || '')
      })

    fromGridEvent(this.grid$, 'filterChanged')
      .pipe(map(({ api }) => api.getQuickFilter()))
      .pipe(distinctUntilChanged())
      .pipe(tap((text) => search.patchState({ value: text })))
      .pipe(takeUntilDestroyed())
      .subscribe()
  }
}
