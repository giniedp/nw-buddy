import { animate, style, transition, trigger } from '@angular/animations'
import { Component, computed, input } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { delayWhen, distinctUntilChanged, of, switchMap } from 'rxjs'

@Component({
  standalone: true,
  selector: 'nwb-loading-bar',
  styleUrl: './loading-bar.component.scss',
  template: `
    @if (show()) {
      <div @fade class="progress-bar w-full" [style.height.px]="height()"></div>
    }
  `,
  host: {
    class: 'block h-0',
  },
  animations: [
    trigger('fade', [
      transition(':enter', [style({ opacity: 0 }), animate('500ms', style({ opacity: 1 }))]),
      transition(':leave', [animate('500ms', style({ opacity: 0 }))]),
    ]),
  ],
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
