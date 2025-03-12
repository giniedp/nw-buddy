import { Directive, Input } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { BehaviorSubject, combineLatest, debounceTime, filter, tap } from 'rxjs'
import { QuicksearchService } from '~/ui/quicksearch'
import { selectStream } from '~/utils'
import { TableGridComponent } from '../table-grid.component'

@Directive({
  standalone: true,
  selector: 'nwb-table-grid[enableQuickfilter]',
})
export class DataGridQuickfilterDirective {
  @Input()
  public set enableQuickfilter(value: boolean) {
    this.enabled$.next(value)
  }

  private enabled$ = new BehaviorSubject<boolean>(false)

  public constructor(search: QuicksearchService, grid: TableGridComponent<any>) {
    combineLatest({
      query: selectStream(search.query$).pipe(debounceTime(500)),
      grid: grid.ready$.pipe(filter((it) => !!it)),
      enabled: this.enabled$,
    })
      .pipe(
        tap(({ query, grid, enabled }) => {
          query = enabled ? query : ''
          grid.api.setGridOption('quickFilterText', query || '')
        }),
      )
      .pipe(takeUntilDestroyed())
      .subscribe()
  }
}
