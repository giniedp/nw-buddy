import { Directive, Input, input, signal } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { ReplaySubject, defer, map, switchMap } from 'rxjs'
import { ItemPreferencesService } from '~/preferences'
import { selectStream } from '~/utils'

@Directive({
  selector: '[nwbItemMarker]',
  exportAs: 'itemMarker',
})
export class ItemMarkerDirective {
  public itemId = input.required<string>({ alias: 'nwbItemMarker' })

  private value$ = toObservable(this.itemId)
    .pipe(switchMap((id) => this.meta.observe(id)))
    .pipe(map((data) => data.meta?.mark))

  public value = toSignal(this.value$)

  public constructor(private meta: ItemPreferencesService) {}
}
