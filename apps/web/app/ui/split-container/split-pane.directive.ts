import { DestroyRef, Directive, input, inject, effect, untracked, ElementRef, signal, linkedSignal } from '@angular/core'
import { SplitGutterComponent } from './split-gutter.component'
import { fromEvent, switchMap, merge, map, takeUntil } from 'rxjs'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { tapDebug } from '~/utils'

@Directive({
  selector: '[nwbSplitPane]',
  host: {
    '[style.flex-basis.px]': 'basis()'
  }
})
export class SplitPaneDirective {
  private elRef = inject<ElementRef<HTMLElement>>(ElementRef)
  private dRef = inject(DestroyRef)

  public gutter = input<SplitGutterComponent>(null, { alias: 'nwbSplitPane' })
  public width = input<number>(null)
  protected basis = linkedSignal(this.width)

  public constructor() {
    effect(() => {
      const gutter = this.gutter()
      untracked(() => this.bindGutter(gutter))
    })
  }

  private bindGutter(gutter: SplitGutterComponent) {
    if (!gutter) {
      return
    }

    gutter.start
      .pipe(
        switchMap((start) => {
          const elementBox = this.elRef.nativeElement.getBoundingClientRect()
          const gutterBox = gutter.elRef.nativeElement.getBoundingClientRect()
          const move$ = fromEvent<MouseEvent>(document, 'mousemove')
          const cancel$ = merge(fromEvent(document, 'mouseup'), fromEvent(document, 'mouseleave'))
          return move$.pipe(
            map((end) => ({ start, end, gutterBox, elementBox })),
            takeUntil(cancel$),
          )
        }),
        takeUntilDestroyed(this.dRef),
      )
      .subscribe(({ start, end, gutterBox, elementBox }) => {
        let delta = start.clientX - end.clientX
        if (gutterBox.left > elementBox.left) {
          delta = -delta
        }
        this.basis.set(Math.max(0, elementBox.width + delta))
      })
  }
}
