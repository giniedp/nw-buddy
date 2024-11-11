import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core'
import { SMOOTH_SWAP_ANIMATION } from './animation'

@Component({
  standalone: true,
  selector: 'nwb-loading-swap',
  template: ` <ng-content /> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
  animations: [SMOOTH_SWAP_ANIMATION],
})
export class LoadingSwapComponent {
  @Input()
  @HostBinding('@smoothSwap')
  public status: any
}
