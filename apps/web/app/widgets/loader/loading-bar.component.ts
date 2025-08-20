import { Component, computed, input } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { delayWhen, distinctUntilChanged, of, switchMap } from 'rxjs'

@Component({
  standalone: true,
  selector: 'nwb-loading-bar',
  styleUrl: './loading-bar.component.scss',
  template: `
    @if (show()) {
      <div
        class="progress-bar w-full fade"
        [style.height.px]="height()"
        animate.enter="fade-in"
        animate.leave="fade-out"
      ></div>
    }
  `,
  host: {
    class: 'block h-0',
  },
})
export class LoadingBarComponent {
  public isLoading = input<boolean>(false)
  public startTime = input<number>(50)
  public holdTime = input<number>(250)
  public height = input<number>(1)

  private config = computed(() => {
    return {
      startTime: this.startTime(),
      holdTime: this.holdTime(),
    }
  })
  private config$ = toObservable(this.config)
  private isLoading$ = toObservable(this.isLoading)
  protected show$ = this.config$.pipe(
    switchMap((config) => {
      return this.isLoading$.pipe(
        distinctUntilChanged(),
        delayWhen((value) => (value ? of(config.startTime) : of(config.holdTime))),
      )
    }),
  )
  protected show = toSignal(this.show$, { initialValue: false })
}
