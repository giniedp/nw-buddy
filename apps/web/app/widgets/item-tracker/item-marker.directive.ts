import { Directive, Input } from '@angular/core'
import { defer, map, ReplaySubject, switchMap } from 'rxjs'
import { ItemPreferencesService } from '~/preferences'

@Directive({
  selector: '[nwbItemMarker]',
  exportAs: 'itemMarker'
})
export class ItemMarkerDirective {
  @Input()
  public set nwbItemMarker(value: string) {
    this.itemId$.next(value)
  }

  public value$ = defer(() => this.itemId$)
    .pipe(switchMap((id) => this.meta.observe(id)))
    .pipe(map((data) => data.meta?.mark))

  private itemId$ = new ReplaySubject<string>(1)

  public constructor(private meta: ItemPreferencesService) {

  }
}
