import { Directive, Input } from '@angular/core'
import { ReplaySubject, defer, map, switchMap } from 'rxjs'
import { ItemPreferencesService } from '~/preferences'
import { selectStream } from '~/utils'

@Directive({
  selector: '[nwbItemMarker]',
  exportAs: 'itemMarker',
})
export class ItemMarkerDirective {
  @Input()
  public set nwbItemMarker(value: string) {
    this.itemId$.next(value)
  }

  public value$ = selectStream(
    defer(() => this.itemId$)
      .pipe(switchMap((id) => this.meta.observe(id)))
      .pipe(map((data) => data.meta?.mark))
  )

  private itemId$ = new ReplaySubject<string>(1)

  public constructor(private meta: ItemPreferencesService) {}
}
