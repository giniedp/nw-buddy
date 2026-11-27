import { ChangeDetectionStrategy, Component, input, output } from '@angular/core'
import { IconsModule } from '~/ui/icons'
import { svgCircleExclamation } from '~/ui/icons/svg'
import { OnboardingRetryComponent } from './onboarding-retry.component'

/**
 * Shown by the pak page while nwbt does not answer: the title, an error and the steps of the platform
 * (`nwb-pak-onboarding-web` or `nwb-pak-onboarding-desktop`) as content. The page keeps asking, the tools open as
 * soon as nwbt answers.
 */
@Component({
  selector: 'nwb-pak-onboarding',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconsModule, OnboardingRetryComponent],
  host: {
    class: 'block overflow-y-auto',
  },
  template: `
    <div class="min-h-full flex items-center justify-center p-4 md:p-8">
      <div class="w-full max-w-xl flex flex-col gap-6">
        <header class="flex flex-col items-center text-center gap-2">
          <h1 class="text-3xl font-bold">NW Buddy Tools</h1>
          <p class="opacity-70">Levels, game files and datasheets of your New World installation.</p>
        </header>
        @if (error(); as error) {
          <div role="alert" class="alert alert-error alert-soft">
            <nwb-icon [icon]="iconError" class="size-5" />
            <span class="min-w-0 break-words">{{ error }}</span>
            <nwb-onboarding-retry [checking]="checking()" (retry)="retry.emit()" />
          </div>
        }
        <ng-content />
      </div>
    </div>
  `,
})
export class PakOnboardingComponent {
  /**
   * A health check is running
   */
  public readonly checking = input(false)
  /**
   * nwbt answered but the tools failed to load, or a desktop app call failed
   */
  public readonly error = input<string | null>(null)
  /**
   * Asks nwbt again now
   */
  public readonly retry = output<void>()

  protected readonly iconError = svgCircleExclamation
}
