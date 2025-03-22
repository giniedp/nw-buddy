import { Directive, effect, ElementRef, inject, input, linkedSignal, untracked } from '@angular/core'
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import { EMPTY, fromEvent, map, merge, switchMap, takeUntil } from 'rxjs'
import { PreferencesService } from '~/preferences'
import { SplitGutterComponent } from './split-gutter.component'

@Directive({
  selector: '[nwbSplitPane]',
  host: {
    '[style.flex-basis.px]': 'basis()',
  },
})
export class SplitPaneDirective {
  private preferences = inject(PreferencesService).session.storageScope('nwb-split')
  private elRef = inject<ElementRef<HTMLElement>>(ElementRef)

  public gutter = input<SplitGutterComponent>(null, { alias: 'nwbSplitPane' })
  public width = input<number>(null, { alias: 'nwbSplitPaneWidth' })
  public storeKey = input<string>(null, { alias: 'nwbSplitPaneKey' })
  protected basis = linkedSignal(this.width)
  private gutter$ = toObservable(this.gutter).pipe(
    switchMap((gutter) => {
      return gutter ? gutter.start : EMPTY
    }),
    switchMap((start) => {
      const elementBox = this.elRef.nativeElement.getBoundingClientRect()
      const gutterBox = this.gutter().elRef.nativeElement.getBoundingClientRect()
      const move$ = fromEvent<MouseEvent>(document, 'mousemove')
      const cancel$ = merge(fromEvent(document, 'mouseup'), fromEvent(document, 'mouseleave'))
      return move$.pipe(
        map((end) => ({ start, end, gutterBox, elementBox })),
        takeUntil(cancel$),
      )
    }),
    map(({ start, end, gutterBox, elementBox }) => {
      let delta = start.clientX - end.clientX
      if (gutterBox.left > elementBox.left) {
        delta = -delta
      }
      return Math.max(0, elementBox.width + delta)
    }),
  )

  public constructor() {
    this.gutter$.pipe(takeUntilDestroyed()).subscribe((value) => {
      this.storeValue(value)
    })
    effect(() => {
      const key = this.storeKey()
      untracked(() => this.loadValue(key))
    })
  }

  private loadValue(key: string) {
    if (!key) {
      return
    }
    const value = this.preferences.get<number>(key)
    if (typeof value !== 'number') {
      return
    }
    this.basis.set(value)
  }

  private storeValue(value: number) {
    this.basis.set(value)
    const key = this.storeKey()
    if (!key) {
      return
    }
    this.preferences.set(key, value)
  }
}
