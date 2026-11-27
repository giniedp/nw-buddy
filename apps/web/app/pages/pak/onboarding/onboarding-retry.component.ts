import { ChangeDetectionStrategy, Component, input, output } from '@angular/core'
import { IconsModule } from '~/ui/icons'
import { svgRotate } from '~/ui/icons/svg'

/**
 * Asks nwbt again, shows a spinner while a check runs
 */
@Component({
  selector: 'nwb-onboarding-retry',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconsModule],
  host: {
    class: 'contents',
  },
  template: `
    <button class="btn btn-sm self-start" [disabled]="checking()" (click)="retry.emit()">
      @if (checking()) {
        <span class="loading loading-spinner loading-xs"></span>
      } @else {
        <nwb-icon [icon]="iconRetry" class="size-4" />
      }
      Retry
    </button>
  `,
})
export class OnboardingRetryComponent {
  public readonly checking = input(false)
  public readonly retry = output<void>()

  protected readonly iconRetry = svgRotate
}
